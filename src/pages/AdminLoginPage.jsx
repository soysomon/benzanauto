import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../lib/adminApi'
import { setStoredAdminSession } from '../lib/adminSession'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      const response = await loginAdmin(form)
      setStoredAdminSession(response.token, response.user)
      navigate('/admin', { replace: true })
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-[44%] bg-[#0A0A0A] flex-col justify-between p-14 relative overflow-hidden">
        <p className="font-body text-[11px] uppercase tracking-[0.28em] text-white/25">
          Benzan Auto Import
        </p>

        <div>
          <h1 className="font-heading text-[clamp(36px,3.8vw,58px)] leading-[0.92] tracking-[-0.03em] text-white">
            Inventario.<br />Control.<br />Resultados.
          </h1>
          <p className="font-body text-white/30 text-sm mt-7 leading-relaxed max-w-[260px]">
            Publica vehículos en minutos. Gestiona el showroom sin complicaciones técnicas.
          </p>
        </div>

        <p className="font-body text-white/15 text-xs">
          {new Date().getFullYear()} · Panel administrativo
        </p>

        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[280px] h-[280px] rounded-full border border-white/[0.06] pointer-events-none" />
        <div className="absolute bottom-32 right-16 w-3 h-3 rounded-full bg-[#d4001a]/60" />
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-[360px]">
          <div className="mb-11">
            <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#d4001a] mb-3">
              Acceso admin
            </p>
            <h2 className="font-heading text-[32px] tracking-tight text-[#0A0A0A] leading-tight">
              Bienvenido de vuelta
            </h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="block font-body text-sm text-[#666] mb-2.5"
                htmlFor="admin-username"
              >
                Usuario
              </label>
              <input
                id="admin-username"
                type="text"
                value={form.username}
                onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))}
                className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
                placeholder="superadmin"
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
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-[#FFF2F3] border border-[#ffd6da] px-4 py-3.5 font-body text-sm text-[#b31a2b]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0A0A] hover:bg-[#222] disabled:opacity-40 text-white font-body text-sm font-medium rounded-full px-5 py-4 transition-colors duration-200 mt-2"
            >
              {loading ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
