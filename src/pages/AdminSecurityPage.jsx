import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminPageShell from '../components/admin/AdminPageShell'
import { useAdminPageSession } from '../hooks/useAdminPageSession'
import { changeAdminPassword } from '../lib/adminApi'

export default function AdminSecurityPage() {
  const navigate = useNavigate()
  const sessionState = useAdminPageSession()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const mustRotatePassword = useMemo(
    () => searchParams.get('reason') === 'must-change-password' || sessionState.user?.mustChangePassword,
    [searchParams, sessionState.user?.mustChangePassword],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      setError('La confirmación no coincide con la nueva contraseña.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const response = await changeAdminPassword(sessionState.token, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })

      sessionState.syncSession(response.token, response.user, response.session ?? null)
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      const successMessage = response.message ?? 'Tu contraseña se actualizó y las demás sesiones quedaron invalidadas.'

      if (mustRotatePassword) {
        navigate('/admin', {
          replace: true,
          state: { message: successMessage },
        })
        return
      }

      setSuccess(successMessage)
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageShell
      title="Seguridad de la cuenta"
      description="Gestiona tu contraseña administrativa. Cuando la cambias, las demás sesiones activas se cierran automáticamente."
      sessionState={sessionState}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <section className="rounded-[32px] bg-white p-8 shadow-sm">
          {mustRotatePassword ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-body text-sm text-amber-800">
              Esta cuenta está marcada para cambiar su contraseña antes de seguir operando con normalidad.
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-body text-sm text-[#666] mb-2.5" htmlFor="security-current-password">
                Contraseña actual
              </label>
              <input
                id="security-current-password"
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="w-full rounded-2xl border border-transparent bg-[#F5F5F5] px-4 py-3.5 font-body text-sm text-[#0A0A0A] focus:border-[#D8D8D8] focus:bg-white focus:outline-none"
                autoComplete="current-password"
                required
              />
            </div>

            <div>
              <label className="block font-body text-sm text-[#666] mb-2.5" htmlFor="security-new-password">
                Nueva contraseña
              </label>
              <input
                id="security-new-password"
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="w-full rounded-2xl border border-transparent bg-[#F5F5F5] px-4 py-3.5 font-body text-sm text-[#0A0A0A] focus:border-[#D8D8D8] focus:bg-white focus:outline-none"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block font-body text-sm text-[#666] mb-2.5" htmlFor="security-confirm-password">
                Confirmar nueva contraseña
              </label>
              <input
                id="security-confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-2xl border border-transparent bg-[#F5F5F5] px-4 py-3.5 font-body text-sm text-[#0A0A0A] focus:border-[#D8D8D8] focus:bg-white focus:outline-none"
                autoComplete="new-password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-[#ffd6da] bg-[#FFF2F3] px-4 py-3.5 font-body text-sm text-[#b31a2b]">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 font-body text-sm text-emerald-800">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#0A0A0A] px-6 py-3.5 font-body text-sm text-white hover:bg-[#222] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
            </button>
          </form>
        </section>

        <aside className="rounded-[32px] bg-white p-8 shadow-sm">
          <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#C5C5C5] mb-4">
            Buenas prácticas
          </p>
          <ul className="space-y-4 font-body text-sm text-[#666] leading-relaxed">
            <li>Usa una contraseña única de al menos 12 caracteres.</li>
            <li>Evita reutilizar credenciales de tu correo o banca.</li>
            <li>Si cambias la contraseña, las demás sesiones quedan invalidadas.</li>
            <li>El sistema ya está preparado para MFA opcional en una fase posterior.</li>
          </ul>
        </aside>
      </div>
    </AdminPageShell>
  )
}
