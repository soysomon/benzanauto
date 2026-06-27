import { useDeferredValue, useEffect, useState } from 'react'
import AdminPageShell from '../components/admin/AdminPageShell'
import { useAdminPageSession } from '../hooks/useAdminPageSession'
import { listAdminAuditLogs } from '../lib/adminApi'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatAction(value) {
  return String(value ?? '')
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export default function AdminAuditPage() {
  const sessionState = useAdminPageSession()
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    page: 1,
  })
  const deferredSearch = useDeferredValue(filters.search.trim())
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 50 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionState.token || !sessionState.isSuperadmin) return

    let ignore = false

    async function loadAuditLogs() {
      try {
        setLoading(true)
        setError('')
        const response = await listAdminAuditLogs(sessionState.token, {
          page: filters.page,
          action: filters.action || undefined,
          search: deferredSearch || undefined,
        })

        if (ignore) return
        setLogs(response.data ?? [])
        setMeta(response.meta ?? { page: 1, pages: 1, total: 0, limit: 50 })
      } catch (loadError) {
        if (!ignore) {
          setLogs([])
          setError(loadError.message ?? 'No se pudo cargar la auditoría.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadAuditLogs()
    return () => {
      ignore = true
    }
  }, [deferredSearch, filters.action, filters.page, sessionState.isSuperadmin, sessionState.token])

  return (
    <AdminPageShell
      title="Auditoría administrativa"
      description="Historial de accesos, bloqueos, reseteos, cambios de contraseña y acciones sensibles del panel."
      sessionState={sessionState}
      requireSuperadmin
    >
      <section className="rounded-[32px] bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <input
            type="text"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
            placeholder="Buscar por acción, actor, IP o navegador"
            className="rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
          />
          <input
            type="text"
            value={filters.action}
            onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value, page: 1 }))}
            placeholder="Filtrar por action exacta"
            className="rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#ffd6da] bg-[#FFF2F3] px-4 py-3.5 font-body text-sm text-[#b31a2b]">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {loading ? (
            <div className="font-body text-sm text-[#777]">Cargando eventos de auditoría...</div>
          ) : logs.length === 0 ? (
            <div className="font-body text-sm text-[#777]">No hay eventos que coincidan con tu búsqueda.</div>
          ) : logs.map((log) => (
            <article key={log.id} className="rounded-[28px] border border-black/5 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#B0B0B0] mb-2">
                    {formatDate(log.createdAt)}
                  </p>
                  <h2 className="font-heading text-xl tracking-tight text-[#0A0A0A]">
                    {formatAction(log.action)}
                  </h2>
                  <p className="font-body text-sm text-[#666] mt-2 leading-relaxed">
                    Actor: {log.actor ? `${log.actor.name} (@${log.actor.username})` : 'Sistema'}
                    {' · '}
                    Objetivo: {log.targetUser ? `${log.targetUser.name} (@${log.targetUser.username})` : 'N/A'}
                  </p>
                </div>

                <div className="font-body text-xs text-[#8A8A8A] text-left lg:text-right">
                  <p>IP: {log.ip || 'No registrada'}</p>
                  <p className="mt-1 max-w-[320px] break-words">{log.userAgent || 'User-Agent no disponible'}</p>
                </div>
              </div>

              <details className="mt-4 rounded-2xl bg-[#FAFAFA] px-4 py-3">
                <summary className="cursor-pointer font-body text-sm text-[#0A0A0A]">Ver metadata</summary>
                <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs text-[#666]">
                  {JSON.stringify(log.metadata ?? {}, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="font-body text-sm text-[#777]">{meta.total} eventos registrados</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              className="rounded-full border border-black/10 px-4 py-2 font-body text-sm text-[#0A0A0A] disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="font-body text-sm text-[#777]">
              Página {meta.page} de {meta.pages}
            </span>
            <button
              type="button"
              disabled={meta.page >= meta.pages}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded-full border border-black/10 px-4 py-2 font-body text-sm text-[#0A0A0A] disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </AdminPageShell>
  )
}
