import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminAuthLayout from '../components/admin/AdminAuthLayout'
import { forgotAdminPassword } from '../lib/adminApi'

export default function AdminForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      const response = await forgotAdminPassword({ identifier })
      setSuccessMessage(response.message ?? 'Si existe una cuenta asociada, enviaremos instrucciones de recuperación.')
    } catch (requestError) {
      setError(requestError.message ?? 'No se pudo procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthLayout
      eyebrow="Recuperación"
      title="Recupera tu acceso"
      description="Introduce tu usuario o correo administrativo. Por seguridad siempre responderemos de forma discreta."
      footer={<Link to="/admin-login" className="text-[#0A0A0A] hover:text-[#d4001a] transition-colors">Volver al login</Link>}
    >
      {successMessage ? (
        <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-6 py-6">
          <p className="font-body text-sm text-emerald-800 leading-relaxed">
            {successMessage}
          </p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block font-body text-sm text-[#666] mb-2.5" htmlFor="admin-recovery-identifier">
              Usuario o correo
            </label>
            <input
              id="admin-recovery-identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full bg-[#F5F5F5] border border-transparent rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C8C8C8] focus:outline-none focus:bg-white focus:border-[#D8D8D8] transition-all duration-200"
              placeholder="superadmin o admin@empresa.com"
              autoComplete="username"
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
            {loading ? 'Enviando instrucciones...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      )}
    </AdminAuthLayout>
  )
}
