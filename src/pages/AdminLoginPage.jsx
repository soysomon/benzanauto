import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AdminAuthLayout from '../components/admin/AdminAuthLayout'
import { loginAdmin } from '../lib/adminApi'
import { getStoredAdminToken, setStoredAdminSession } from '../lib/adminSession'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(() => location.state?.message ?? '')

  useEffect(() => {
    if (getStoredAdminToken()) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      setMessage('')
      const response = await loginAdmin(form)
      setStoredAdminSession(response.token, response.user)
      navigate(
        response.user?.mustChangePassword ? '/admin/security?reason=must-change-password' : '/admin',
        { replace: true },
      )
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthLayout
      eyebrow="Acceso admin"
      title="Bienvenido de vuelta"
      description="Inicia sesión con tu usuario o correo administrativo. La sesión queda auditada y protegida con bloqueo temporal por intentos fallidos."
      footer={(
        <div className="flex items-center justify-between gap-4">
          <Link to="/admin/forgot-password" className="text-[#0A0A0A] hover:text-[#d4001a] transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link to="/" className="text-[#777] hover:text-[#0A0A0A] transition-colors">
            Volver al sitio
          </Link>
        </div>
      )}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="block font-body text-sm text-[#666] mb-2.5"
            htmlFor="admin-identifier"
          >
            Usuario o correo
          </label>
          <input
            id="admin-identifier"
            type="text"
            value={form.identifier}
            onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
            className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
            placeholder="superadmin o admin@empresa.com"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label
            className="block font-body text-sm text-[#666] mb-2.5"
            htmlFor="admin-password"
          >
            Contraseña
          </label>
          <input
            id="admin-password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 font-body text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-[#FFF2F3] border border-[#ffd6da] px-4 py-3.5 font-body text-sm text-[#b31a2b]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0A0A0A] hover:bg-[#222] disabled:opacity-40 text-white font-body text-sm font-medium rounded-full px-5 py-4 transition-colors duration-200 mt-2"
        >
          {loading ? 'Verificando...' : 'Entrar al panel'}
        </button>
      </form>
    </AdminAuthLayout>
  )
}
