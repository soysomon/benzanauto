import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AdminAuthLayout from '../components/admin/AdminAuthLayout'
import { resetAdminPassword, validateAdminResetPasswordToken } from '../lib/adminApi'

export default function AdminResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])

  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenMessage, setTokenMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    let ignore = false

    async function validateToken() {
      if (!token) {
        setTokenMessage('El enlace de recuperación no es válido o está incompleto.')
        setTokenValid(false)
        setValidating(false)
        return
      }

      try {
        setValidating(true)
        const response = await validateAdminResetPasswordToken(token)
        if (ignore) return
        setTokenValid(Boolean(response.valid))
        setTokenMessage(response.message ?? '')
      } catch (validationError) {
        if (ignore) return
        setTokenValid(false)
        setTokenMessage(validationError.message ?? 'No se pudo validar el enlace de recuperación.')
      } finally {
        if (!ignore) {
          setValidating(false)
        }
      }
    }

    validateToken()
    return () => {
      ignore = true
    }
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      setError('La confirmación no coincide con la nueva contraseña.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await resetAdminPassword({
        token,
        newPassword: form.newPassword,
      })
      navigate('/admin-login', {
        replace: true,
        state: { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' },
      })
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthLayout
      eyebrow="Nueva contraseña"
      title="Restablece tu contraseña"
      description="Elige una contraseña fuerte y distinta a las anteriores. Al completarlo, se cerrarán las sesiones anteriores por seguridad."
      footer={<Link to="/admin-login" className="text-[#0A0A0A] hover:text-[#d4001a] transition-colors">Volver al login</Link>}
    >
      {validating ? (
        <div className="rounded-[28px] border border-black/5 bg-[#F8F8F8] px-6 py-8">
          <p className="font-body text-sm text-[#666]">Validando enlace seguro...</p>
        </div>
      ) : !tokenValid ? (
        <div className="rounded-[28px] border border-[#ffd6da] bg-[#FFF2F3] px-6 py-6">
          <p className="font-body text-sm text-[#b31a2b] leading-relaxed">
            {tokenMessage || 'El enlace ya no es válido. Solicita uno nuevo para continuar.'}
          </p>
          <Link
            to="/admin/forgot-password"
            className="inline-flex mt-5 rounded-full bg-[#0A0A0A] px-5 py-3 font-body text-sm text-white hover:bg-[#222] transition-colors"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {tokenMessage ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 font-body text-sm text-emerald-800">
              {tokenMessage}
            </div>
          ) : null}

          <div>
            <label className="block font-body text-sm text-[#666] mb-2.5" htmlFor="reset-password-new">
              Nueva contraseña
            </label>
            <input
              id="reset-password-new"
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
              className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
              placeholder="Mínimo 12 caracteres"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="block font-body text-sm text-[#666] mb-2.5" htmlFor="reset-password-confirm">
              Confirmar contraseña
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl bg-[#FFF2F3] border border-[#ffd6da] px-4 py-3.5 font-body text-sm text-[#b31a2b]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A0A0A] hover:bg-[#222] disabled:opacity-40 text-white font-body text-sm font-medium rounded-full px-5 py-4 transition-colors duration-200"
          >
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}
    </AdminAuthLayout>
  )
}
