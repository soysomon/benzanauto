import nodemailer from 'nodemailer'
import { env, isProduction, isTest } from '../config/env.js'
import { logger } from '../utils/logger.js'

let transporter
let verifyPromise = null
const sentEmails = []
const emailHealth = {
  provider: env.EMAIL_PROVIDER,
  enabled: env.EMAIL_PROVIDER === 'smtp',
  verified: env.EMAIL_PROVIDER !== 'smtp',
  status: env.EMAIL_PROVIDER === 'smtp' ? 'unknown' : 'disabled',
  lastVerificationAttemptAt: null,
  lastVerifiedAt: null,
  lastDeliveryAt: null,
  lastError: null,
}
const emailLogger = logger.child({ scope: 'email' })

function getAdminBaseUrl() {
  return env.FRONTEND_ADMIN_URL || env.FRONTEND_URL || 'http://localhost:5173/admin'
}

function normalizeAdminPath(pathname) {
  const base = getAdminBaseUrl().replace(/\/$/, '')
  const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${suffix}`
}

function getTransporter() {
  if (env.EMAIL_PROVIDER !== 'smtp') {
    return null
  }

  if (!transporter) {
    const transportConfig = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      pool: env.SMTP_POOL,
      requireTLS: env.SMTP_REQUIRE_TLS,
      connectionTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
      greetingTimeout: env.SMTP_GREETING_TIMEOUT_MS,
      socketTimeout: env.SMTP_SOCKET_TIMEOUT_MS,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    }

    if (env.SMTP_TLS_SERVERNAME) {
      transportConfig.tls = {
        servername: env.SMTP_TLS_SERVERNAME,
      }
    }

    transporter = nodemailer.createTransport(transportConfig)
  }

  return transporter
}

function formatHeaderAddress(name, email) {
  const normalizedEmail = String(email ?? '').trim()
  if (!normalizedEmail) return ''

  const normalizedName = String(name ?? '').trim().replace(/"/g, '\\"')
  return normalizedName ? `"${normalizedName}" <${normalizedEmail}>` : normalizedEmail
}

function normalizeError(error) {
  if (!error) return null

  return {
    name: error.name ?? 'Error',
    message: error.message ?? 'Unknown email error.',
    code: error.code ?? null,
    command: error.command ?? null,
  }
}

function markEmailError(error) {
  emailHealth.verified = false
  emailHealth.status = 'error'
  emailHealth.lastError = normalizeError(error)
}

export async function verifyEmailTransport({ force = false } = {}) {
  if (env.EMAIL_PROVIDER !== 'smtp') {
    emailHealth.provider = env.EMAIL_PROVIDER
    emailHealth.enabled = false
    emailHealth.verified = true
    emailHealth.status = 'disabled'
    emailHealth.lastError = null
    return { ok: true, skipped: true, reason: 'provider-disabled', health: getEmailHealth() }
  }

  if (verifyPromise && !force) {
    return verifyPromise
  }

  const client = getTransporter()
  emailHealth.provider = env.EMAIL_PROVIDER
  emailHealth.enabled = true
  emailHealth.status = 'verifying'
  emailHealth.lastVerificationAttemptAt = new Date().toISOString()

  verifyPromise = client.verify()
    .then(() => {
      emailHealth.verified = true
      emailHealth.status = 'ready'
      emailHealth.lastVerifiedAt = new Date().toISOString()
      emailHealth.lastError = null

      return { ok: true, skipped: false, health: getEmailHealth() }
    })
    .catch((error) => {
      markEmailError(error)
      throw error
    })
    .finally(() => {
      verifyPromise = null
    })

  return verifyPromise
}

export function getEmailHealth() {
  return {
    ...emailHealth,
  }
}

async function deliverEmail({ to, subject, text, html, category }) {
  const payload = {
    to,
    subject,
    text,
    html,
    category,
    sentAt: new Date().toISOString(),
  }

  if (!to) return { delivered: false, reason: 'missing-recipient', payload }

  if (env.EMAIL_PROVIDER !== 'smtp') {
    if (!isProduction()) {
      emailLogger.debug('email_delivery_skipped', {
        category,
        to,
        reason: 'provider_disabled',
      })
    }

    if (isTest()) {
      sentEmails.push(payload)
    }

    return { delivered: false, reason: 'provider-disabled', payload }
  }

  const client = getTransporter()
  try {
    await client.sendMail({
      from: formatHeaderAddress(env.EMAIL_FROM_NAME, env.EMAIL_FROM),
      to,
      replyTo: env.EMAIL_REPLY_TO || undefined,
      subject,
      text,
      html,
    })
  } catch (error) {
    markEmailError(error)
    emailLogger.error('email_delivery_failed', {
      category,
      to,
      error,
    })
    throw error
  }

  emailHealth.status = 'ready'
  emailHealth.verified = true
  emailHealth.lastDeliveryAt = new Date().toISOString()
  emailHealth.lastError = null

  if (isTest()) {
    sentEmails.push(payload)
  }

  return { delivered: true, payload }
}

function buildEmailLayout({ title, intro, bodyLines = [], ctaLabel, ctaUrl, outro }) {
  const text = [
    title,
    '',
    intro,
    ...bodyLines,
    '',
    ctaUrl ? `${ctaLabel}: ${ctaUrl}` : null,
    outro ?? 'Si no reconoces esta acción, ignora este mensaje y revisa la seguridad de tu cuenta.',
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px">
      <p style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#d4001a;margin:0 0 12px">Benzan Auto Admin</p>
      <h1 style="font-size:28px;line-height:1.15;margin:0 0 16px">${title}</h1>
      <p style="margin:0 0 12px">${intro}</p>
      ${bodyLines.map((line) => `<p style="margin:0 0 12px">${line}</p>`).join('')}
      ${ctaUrl ? `
        <p style="margin:24px 0">
          <a href="${ctaUrl}" style="display:inline-block;background:#0A0A0A;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">${ctaLabel}</a>
        </p>
        <p style="font-size:12px;color:#6b7280;word-break:break-all">${ctaUrl}</p>
      ` : ''}
      <p style="margin-top:24px;color:#6b7280">${outro ?? 'Si no reconoces esta acción, ignora este mensaje y revisa la seguridad de tu cuenta.'}</p>
    </div>
  `

  return { text, html }
}

export function buildResetPasswordUrl(token) {
  const url = new URL(normalizeAdminPath('/reset-password'))
  url.searchParams.set('token', token)
  return url.toString()
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = buildResetPasswordUrl(token)
  const content = buildEmailLayout({
    title: 'Recupera tu contraseña',
    intro: `Hola ${name || ''}. Recibimos una solicitud para restablecer tu contraseña del panel admin de Benzan Auto.`,
    bodyLines: [
      'Este enlace es de un solo uso y expira pronto por seguridad.',
      'Si tú no solicitaste este cambio, puedes ignorar este correo.',
    ],
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetUrl,
  })

  return deliverEmail({
    to,
    subject: 'Benzan Admin · Recuperación de contraseña',
    category: 'password_reset',
    ...content,
  })
}

export async function sendPasswordChangedEmail({ to, name }) {
  const content = buildEmailLayout({
    title: 'Tu contraseña fue actualizada',
    intro: `Hola ${name || ''}. La contraseña de tu acceso administrativo fue cambiada correctamente.`,
    bodyLines: [
      'Si realizaste este cambio, no necesitas hacer nada más.',
      'Si no fuiste tú, contacta al super admin de inmediato y revisa tus accesos.',
    ],
    ctaLabel: 'Ir al panel',
    ctaUrl: getAdminBaseUrl(),
  })

  return deliverEmail({
    to,
    subject: 'Benzan Admin · Contraseña actualizada',
    category: 'password_changed',
    ...content,
  })
}

export async function sendUserCreatedEmail({ to, name, username, mustChangePassword }) {
  const content = buildEmailLayout({
    title: 'Tu cuenta administrativa fue creada',
    intro: `Hola ${name || ''}. Ya tienes acceso al panel administrativo de Benzan Auto.`,
    bodyLines: [
      `Usuario: ${username}`,
      mustChangePassword
        ? 'Tu cuenta quedó marcada para cambiar la contraseña en el primer acceso.'
        : 'Puedes iniciar sesión con las credenciales enviadas por tu administrador.',
    ],
    ctaLabel: 'Abrir acceso admin',
    ctaUrl: getAdminBaseUrl(),
  })

  return deliverEmail({
    to,
    subject: 'Benzan Admin · Cuenta creada',
    category: 'user_created',
    ...content,
  })
}

export async function sendUserBlockedStateEmail({ to, name, isBlocked }) {
  const content = buildEmailLayout({
    title: isBlocked ? 'Tu acceso fue bloqueado' : 'Tu acceso fue desbloqueado',
    intro: `Hola ${name || ''}. Hubo un cambio en el estado de tu cuenta administrativa.`,
    bodyLines: [
      isBlocked
        ? 'Tu acceso fue bloqueado por un administrador. Si necesitas ayuda, contacta al super admin.'
        : 'Tu acceso fue habilitado nuevamente. Ya puedes volver a iniciar sesión.',
    ],
    ctaLabel: 'Ir al acceso admin',
    ctaUrl: getAdminBaseUrl(),
  })

  return deliverEmail({
    to,
    subject: isBlocked ? 'Benzan Admin · Cuenta bloqueada' : 'Benzan Admin · Cuenta desbloqueada',
    category: isBlocked ? 'user_blocked' : 'user_unblocked',
    ...content,
  })
}

export function getSentEmailsForTesting() {
  return sentEmails
}

export function clearSentEmailsForTesting() {
  sentEmails.length = 0
}
