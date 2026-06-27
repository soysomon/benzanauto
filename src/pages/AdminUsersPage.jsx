import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import AdminPageShell from '../components/admin/AdminPageShell'
import { useAdminPageSession } from '../hooks/useAdminPageSession'
import {
  blockAdminUser,
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  unblockAdminUser,
  updateAdminUser,
  updateAdminUserPassword,
  updateAdminUserRole,
} from '../lib/adminApi'

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

function createUserForm() {
  return {
    id: '',
    name: '',
    username: '',
    email: '',
    role: 'admin',
    isActive: true,
    mustChangePassword: true,
    password: '',
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function StatusBadge({ tone = 'neutral', children }) {
  const toneMap = {
    neutral: 'bg-black/5 text-[#444]',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-[#FFF2F3] text-[#b31a2b]',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 font-body text-xs ${toneMap[tone] ?? toneMap.neutral}`}>
      {children}
    </span>
  )
}

export default function AdminUsersPage() {
  const sessionState = useAdminPageSession()
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
    isBlocked: '',
    page: 1,
  })
  const deferredSearch = useDeferredValue(filters.search.trim())
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [editorMode, setEditorMode] = useState('create')
  const [form, setForm] = useState(createUserForm())
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ password: '', mustChangePassword: true })
  const [passwordSaving, setPasswordSaving] = useState(false)

  const currentUserId = sessionState.user?.id ?? ''
  const selectedUser = useMemo(
    () => users.find((user) => user.id === form.id) ?? null,
    [form.id, users],
  )

  useEffect(() => {
    if (!sessionState.token || !sessionState.isSuperadmin) return

    let ignore = false

    async function loadUsers() {
      try {
        setLoading(true)
        setError('')
        const response = await listAdminUsers(sessionState.token, {
          page: filters.page,
          search: deferredSearch || undefined,
          role: filters.role || undefined,
          isActive: filters.isActive === '' ? undefined : filters.isActive,
          isBlocked: filters.isBlocked === '' ? undefined : filters.isBlocked,
        })

        if (ignore) return

        setUsers(response.data ?? [])
        setMeta(response.meta ?? { page: 1, pages: 1, total: 0, limit: 20 })

        if (editorMode === 'edit' && form.id) {
          const fresh = (response.data ?? []).find((item) => item.id === form.id)
          if (fresh) {
            setForm((current) => ({
              ...current,
              name: fresh.name ?? '',
              username: fresh.username ?? '',
              email: fresh.email ?? '',
              role: fresh.role ?? 'admin',
              isActive: Boolean(fresh.isActive),
              mustChangePassword: Boolean(fresh.mustChangePassword),
            }))
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setUsers([])
          setError(loadError.message ?? 'No se pudo cargar la lista de usuarios.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadUsers()
    return () => {
      ignore = true
    }
  }, [
    deferredSearch,
    editorMode,
    filters.isActive,
    filters.isBlocked,
    filters.page,
    filters.role,
    form.id,
    sessionState.isSuperadmin,
    sessionState.token,
  ])

  const openCreate = () => {
    setEditorMode('create')
    setForm(createUserForm())
    setPasswordForm({ password: '', mustChangePassword: true })
    setError('')
    setFeedback('')
  }

  const openEdit = (user) => {
    setEditorMode('edit')
    setForm({
      id: user.id,
      name: user.name ?? '',
      username: user.username ?? '',
      email: user.email ?? '',
      role: user.role ?? 'admin',
      isActive: Boolean(user.isActive),
      mustChangePassword: Boolean(user.mustChangePassword),
      password: '',
    })
    setPasswordForm({ password: '', mustChangePassword: true })
    setError('')
    setFeedback('')
  }

  const refreshUsers = async () => {
    const response = await listAdminUsers(sessionState.token, {
      page: filters.page,
      search: deferredSearch || undefined,
      role: filters.role || undefined,
      isActive: filters.isActive === '' ? undefined : filters.isActive,
      isBlocked: filters.isBlocked === '' ? undefined : filters.isBlocked,
    })

    setUsers(response.data ?? [])
    setMeta(response.meta ?? { page: 1, pages: 1, total: 0, limit: 20 })
    return response
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      setFeedback('')

      if (editorMode === 'create') {
        const response = await createAdminUser(sessionState.token, {
          name: form.name,
          username: form.username,
          email: form.email || undefined,
          role: form.role,
          password: form.password,
          isActive: form.isActive,
          mustChangePassword: form.mustChangePassword,
        })

        await refreshUsers()
        openEdit(response.user)
        setFeedback(response.message ?? 'Usuario creado correctamente.')
        return
      }

      const originalRole = selectedUser?.role ?? form.role
      const basePayload = {
        name: form.name,
        username: form.username,
        email: form.email || null,
        isActive: form.isActive,
        mustChangePassword: form.mustChangePassword,
      }

      const response = await updateAdminUser(sessionState.token, form.id, basePayload)

      if (form.role !== originalRole) {
        await updateAdminUserRole(sessionState.token, form.id, { role: form.role })
      }

      await refreshUsers()
      setFeedback(response.message ?? 'Usuario actualizado correctamente.')
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    if (!form.id) return

    try {
      setPasswordSaving(true)
      setError('')
      setFeedback('')
      const response = await updateAdminUserPassword(sessionState.token, form.id, passwordForm)
      await refreshUsers()
      setFeedback(response.message ?? 'Contraseña del usuario actualizada correctamente.')
      setPasswordForm({ password: '', mustChangePassword: true })
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo cambiar la contraseña del usuario.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleBlockToggle = async (user) => {
    try {
      setError('')
      setFeedback('')
      const response = user.isBlocked
        ? await unblockAdminUser(sessionState.token, user.id)
        : await blockAdminUser(sessionState.token, user.id)
      await refreshUsers()
      setFeedback(response.message ?? (user.isBlocked ? 'Usuario desbloqueado correctamente.' : 'Usuario bloqueado correctamente.'))
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo actualizar el bloqueo del usuario.')
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`¿Seguro que quieres desactivar a ${user.name}?`)
    if (!confirmed) return

    try {
      setError('')
      setFeedback('')
      const response = await deleteAdminUser(sessionState.token, user.id)
      await refreshUsers()
      setFeedback(response.message ?? 'Usuario desactivado correctamente.')
      if (form.id === user.id) {
        openCreate()
      }
    } catch (submitError) {
      setError(submitError.message ?? 'No se pudo desactivar el usuario.')
    }
  }

  return (
    <AdminPageShell
      title="Gestión de usuarios"
      description="Alta, edición, bloqueo y control de accesos para cuentas administrativas del panel."
      sessionState={sessionState}
      requireSuperadmin
      actions={(
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-[#0A0A0A] px-5 py-2.5 font-body text-sm text-white hover:bg-[#222] transition-colors"
        >
          Nuevo usuario
        </button>
      )}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <section className="rounded-[32px] bg-white p-6 shadow-sm space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
              placeholder="Buscar por nombre, usuario o correo"
              className="md:col-span-2 rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
            />

            <select
              value={filters.role}
              onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}
              className="rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
            >
              <option value="">Todos los roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            <select
              value={filters.isBlocked}
              onChange={(event) => setFilters((current) => ({ ...current, isBlocked: event.target.value, page: 1 }))}
              className="rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
            >
              <option value="">Bloqueados y activos</option>
              <option value="false">Solo habilitados</option>
              <option value="true">Solo bloqueados</option>
            </select>
          </div>

          {error ? (
            <div className="rounded-2xl border border-[#ffd6da] bg-[#FFF2F3] px-4 py-3.5 font-body text-sm text-[#b31a2b]">
              {error}
            </div>
          ) : null}

          {feedback ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 font-body text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[28px] border border-black/5">
            <div className="grid grid-cols-[minmax(0,2fr)_120px_120px_120px] gap-4 border-b border-black/5 px-5 py-4 font-body text-[11px] uppercase tracking-[0.22em] text-[#B0B0B0]">
              <span>Usuario</span>
              <span>Rol</span>
              <span>Estado</span>
              <span className="text-right">Acciones</span>
            </div>

            {loading ? (
              <div className="px-5 py-8 font-body text-sm text-[#777]">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="px-5 py-8 font-body text-sm text-[#777]">No hay usuarios que coincidan con los filtros.</div>
            ) : users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              return (
                <div key={user.id} className="grid grid-cols-[minmax(0,2fr)_120px_120px_120px] gap-4 items-center px-5 py-4 border-b last:border-b-0 border-black/5">
                  <button type="button" onClick={() => openEdit(user)} className="text-left">
                    <p className="font-body text-sm text-[#0A0A0A]">{user.name}</p>
                    <p className="font-body text-xs text-[#8A8A8A] mt-1">
                      @{user.username} {user.email ? `· ${user.email}` : ''}
                    </p>
                  </button>
                  <span className="font-body text-sm text-[#555]">{ROLE_OPTIONS.find((role) => role.value === user.role)?.label ?? user.role}</span>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={user.isBlocked ? 'danger' : user.isActive ? 'success' : 'warning'}>
                      {user.isBlocked ? 'Bloqueado' : user.isActive ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                    {user.mustChangePassword ? <StatusBadge tone="warning">Debe cambiar clave</StatusBadge> : null}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => handleBlockToggle(user)} className="font-body text-xs text-[#777] hover:text-[#0A0A0A] transition-colors">
                      {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    {!isCurrentUser ? (
                      <button type="button" onClick={() => handleDelete(user)} className="font-body text-xs text-[#b31a2b] hover:text-[#8e1422] transition-colors">
                        Desactivar
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="font-body text-sm text-[#777]">
              {meta.total} usuarios registrados
            </p>
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

        <aside className="space-y-6">
          <section className="rounded-[32px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#B0B0B0]">
                  {editorMode === 'create' ? 'Alta segura' : 'Editar usuario'}
                </p>
                <h2 className="font-heading text-2xl tracking-tight text-[#0A0A0A] mt-2">
                  {editorMode === 'create' ? 'Nuevo acceso admin' : form.name || 'Cuenta seleccionada'}
                </h2>
              </div>
              {editorMode === 'edit' ? (
                <button type="button" onClick={openCreate} className="font-body text-sm text-[#777] hover:text-[#0A0A0A] transition-colors">
                  Crear otro
                </button>
              ) : null}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block font-body text-sm text-[#666] mb-2" htmlFor="user-name">Nombre</label>
                <input
                  id="user-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm focus:border-[#CFCFCF] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-sm text-[#666] mb-2" htmlFor="user-username">Usuario</label>
                <input
                  id="user-username"
                  type="text"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm focus:border-[#CFCFCF] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-sm text-[#666] mb-2" htmlFor="user-email">Correo</label>
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm focus:border-[#CFCFCF] focus:outline-none"
                  placeholder="Opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-[#666] mb-2" htmlFor="user-role">Rol</label>
                  <select
                    id="user-role"
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                    className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm focus:border-[#CFCFCF] focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="inline-flex items-center gap-2 font-body text-sm text-[#666]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    />
                    Cuenta activa
                  </label>
                  <label className="inline-flex items-center gap-2 font-body text-sm text-[#666]">
                    <input
                      type="checkbox"
                      checked={form.mustChangePassword}
                      onChange={(event) => setForm((current) => ({ ...current, mustChangePassword: event.target.checked }))}
                    />
                    Forzar cambio de clave
                  </label>
                </div>
              </div>

              {editorMode === 'create' ? (
                <div>
                  <label className="block font-body text-sm text-[#666] mb-2" htmlFor="user-password">Contraseña inicial</label>
                  <input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm focus:border-[#CFCFCF] focus:outline-none"
                    required
                  />
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0A0A0A] px-5 py-3 font-body text-sm text-white hover:bg-[#222] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : editorMode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </form>
          </section>

          {editorMode === 'edit' && selectedUser ? (
            <section className="rounded-[32px] bg-white p-6 shadow-sm">
              <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#B0B0B0] mb-3">
                Seguridad de la cuenta
              </p>
              <h3 className="font-heading text-xl tracking-tight text-[#0A0A0A] mb-5">
                Restablecer contraseña
              </h3>

              <form className="space-y-4" onSubmit={handlePasswordReset}>
                <div>
                  <label className="block font-body text-sm text-[#666] mb-2" htmlFor="reset-user-password">
                    Nueva contraseña temporal
                  </label>
                  <input
                    id="reset-user-password"
                    type="password"
                    value={passwordForm.password}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm focus:border-[#CFCFCF] focus:outline-none"
                    required
                  />
                </div>

                <label className="inline-flex items-center gap-2 font-body text-sm text-[#666]">
                  <input
                    type="checkbox"
                    checked={passwordForm.mustChangePassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, mustChangePassword: event.target.checked }))}
                  />
                  Pedir cambio en el próximo acceso
                </label>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-full border border-black/10 px-5 py-3 font-body text-sm text-[#0A0A0A] hover:bg-[#F3F3F3] disabled:opacity-50 transition-colors"
                >
                  {passwordSaving ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-black/5 space-y-2 font-body text-sm text-[#777]">
                <p>Último acceso: {formatDate(selectedUser.lastLoginAt)}</p>
                <p>Último cambio de contraseña: {formatDate(selectedUser.passwordChangedAt)}</p>
                <p>Bloqueo temporal hasta: {formatDate(selectedUser.lockedUntil)}</p>
                <p>Intentos fallidos acumulados: {selectedUser.failedLoginAttempts ?? 0}</p>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </AdminPageShell>
  )
}
