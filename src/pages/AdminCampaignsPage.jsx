import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import AdminPageShell from '../components/admin/AdminPageShell'
import StatePanel from '../components/ui/StatePanel'
import FloatingToast from '../components/ui/FloatingToast'
import { useAdminPageSession } from '../hooks/useAdminPageSession'
import {
  createAdminCampaign,
  deleteAdminCampaignImage,
  listAdminCampaigns,
  updateAdminCampaign,
  updateAdminCampaignStatus,
  uploadAdminCampaignImage,
} from '../lib/adminApi'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'archived', label: 'Archivada' },
]

const FREQUENCY_OPTIONS = [
  { value: 'session', label: 'Una vez por sesión' },
  { value: 'daily', label: 'Una vez al día' },
  { value: 'once', label: 'Una sola vez' },
  { value: 'always', label: 'Siempre que aplique' },
]

const DISPLAY_OPTIONS = [
  { value: 'modal', label: 'Modal promocional' },
]

const DEVICE_OPTIONS = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'mobile', label: 'Mobile' },
]
const HOMEPAGE_ROUTE = '/'

function roleCanManageCampaigns(role) {
  return ['superadmin', 'admin', 'editor'].includes(role)
}

function createCampaignForm() {
  return {
    id: '',
    title: '',
    description: '',
    imageAlt: '',
    ctaText: '',
    ctaUrl: '',
    status: 'draft',
    startAt: '',
    endAt: '',
    delaySeconds: '3',
    frequencyRule: 'session',
    priority: '100',
    displayType: 'modal',
    targetDevices: DEVICE_OPTIONS.map((option) => option.value),
  }
}

function toDateTimeLocalValue(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function buildCampaignPayload(form, { forceStatus = null } = {}) {
  return {
    title: form.title,
    description: form.description,
    imageAlt: form.imageAlt || undefined,
    ctaText: form.ctaText || undefined,
    ctaUrl: form.ctaUrl || undefined,
    status: forceStatus ?? form.status,
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    delaySeconds: Number(form.delaySeconds || 0),
    frequencyRule: form.frequencyRule,
    priority: Number(form.priority || 0),
    displayType: form.displayType,
    targetRoutes: [HOMEPAGE_ROUTE],
    targetDevices: form.targetDevices,
  }
}

function campaignToForm(campaign) {
  return {
    id: campaign.id,
    title: campaign.title ?? '',
    description: campaign.description ?? '',
    imageAlt: campaign.imageAlt ?? '',
    ctaText: campaign.ctaText ?? '',
    ctaUrl: campaign.ctaUrl ?? '',
    status: campaign.status ?? 'draft',
    startAt: toDateTimeLocalValue(campaign.startAt),
    endAt: toDateTimeLocalValue(campaign.endAt),
    delaySeconds: String(campaign.delaySeconds ?? 3),
    frequencyRule: campaign.frequencyRule ?? 'session',
    priority: String(campaign.priority ?? 100),
    displayType: campaign.displayType ?? 'modal',
    targetDevices: Array.isArray(campaign.targetDevices) && campaign.targetDevices.length
      ? campaign.targetDevices
      : DEVICE_OPTIONS.map((option) => option.value),
  }
}

function formatDateTime(value) {
  if (!value) return 'Sin definir'
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getFirstFieldError(details) {
  const fieldErrors = details?.fieldErrors
  if (!fieldErrors || typeof fieldErrors !== 'object') return ''

  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages) && messages[0]) {
      return messages[0]
    }
  }

  return ''
}

function mapFieldErrors(details) {
  const fieldErrors = details?.fieldErrors
  if (!fieldErrors || typeof fieldErrors !== 'object') return {}

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => Array.isArray(messages) && messages[0])
      .map(([key, messages]) => [key, messages[0]]),
  )
}

function inputClass(hasError) {
  return [
    'w-full rounded-2xl border px-4 py-3 font-body text-sm focus:outline-none',
    hasError
      ? 'border-[#ffb7bf] bg-[#FFF7F8] text-[#0A0A0A] focus:border-[#ff9aa7]'
      : 'border-[#ECECEC] text-[#0A0A0A] focus:border-[#CFCFCF]',
  ].join(' ')
}

function badgeClass(status) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'paused':
      return 'bg-amber-50 text-amber-700'
    case 'archived':
      return 'bg-[#F4F4F4] text-[#666]'
    case 'draft':
    default:
      return 'bg-[#FFF2F3] text-[#b31a2b]'
  }
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-2 font-body text-xs text-[#b31a2b]">{message}</p>
}

function SectionLabel({ children }) {
  return <p className="font-body text-[11px] uppercase tracking-[0.26em] text-[#B5B5B5] mb-3">{children}</p>
}

export default function AdminCampaignsPage() {
  const sessionState = useAdminPageSession()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
  })
  const deferredSearch = useDeferredValue(filters.search.trim())
  const [campaigns, setCampaigns] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState(createCampaignForm())
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [statusActionId, setStatusActionId] = useState('')
  const [queuedImageFile, setQueuedImageFile] = useState(null)
  const [queuedImagePreview, setQueuedImagePreview] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === form.id) ?? null,
    [campaigns, form.id],
  )

  useEffect(() => () => {
    if (queuedImagePreview) {
      URL.revokeObjectURL(queuedImagePreview)
    }
  }, [queuedImagePreview])

  useEffect(() => {
    if (!sessionState.token || !roleCanManageCampaigns(sessionState.user?.role)) return

    let ignore = false

    async function loadCampaigns() {
      try {
        setLoading(true)
        setError('')
        const response = await listAdminCampaigns(sessionState.token, {
          page: filters.page,
          q: deferredSearch || undefined,
          status: filters.status || undefined,
        })

        if (ignore) return

        setCampaigns(response.data ?? [])
        setMeta(response.meta ?? { page: 1, pages: 1, total: 0, limit: 20 })

        if (form.id) {
          const freshCampaign = (response.data ?? []).find((campaign) => campaign.id === form.id)
          if (freshCampaign) {
            setForm(campaignToForm(freshCampaign))
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setCampaigns([])
          setError(loadError.message ?? 'No se pudo cargar la lista de campañas.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadCampaigns()
    return () => {
      ignore = true
    }
  }, [deferredSearch, filters.page, filters.status, form.id, sessionState.token, sessionState.user?.role])

  const refreshCampaigns = async () => {
    const response = await listAdminCampaigns(sessionState.token, {
      page: filters.page,
      q: deferredSearch || undefined,
      status: filters.status || undefined,
    })

    setCampaigns(response.data ?? [])
    setMeta(response.meta ?? { page: 1, pages: 1, total: 0, limit: 20 })
    return response
  }

  const openCreate = () => {
    setForm(createCampaignForm())
    setFormErrors({})
    setError('')
    setFeedback('')
    setUploadProgress(0)
    setQueuedImageFile(null)
    if (queuedImagePreview) {
      URL.revokeObjectURL(queuedImagePreview)
      setQueuedImagePreview('')
    }
  }

  const openEdit = (campaign) => {
    setForm(campaignToForm(campaign))
    setFormErrors({})
    setError('')
    setFeedback('')
    setUploadProgress(0)
    setQueuedImageFile(null)
    if (queuedImagePreview) {
      URL.revokeObjectURL(queuedImagePreview)
      setQueuedImagePreview('')
    }
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleDevice = (device) => {
    setForm((current) => {
      const nextDevices = current.targetDevices.includes(device)
        ? current.targetDevices.filter((value) => value !== device)
        : [...current.targetDevices, device]

      return {
        ...current,
        targetDevices: nextDevices.length ? nextDevices : current.targetDevices,
      }
    })
  }

  const handleImageChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null
    setFormErrors((current) => ({ ...current, imageFile: '' }))
    setUploadProgress(0)

    if (queuedImagePreview) {
      URL.revokeObjectURL(queuedImagePreview)
      setQueuedImagePreview('')
    }

    if (!nextFile) {
      setQueuedImageFile(null)
      return
    }

    setQueuedImageFile(nextFile)
    setQueuedImagePreview(URL.createObjectURL(nextFile))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const currentHasImage = Boolean(selectedCampaign?.imageUrl)
    const needsDeferredActivation = form.status === 'active' && !currentHasImage && Boolean(queuedImageFile)

    if (form.status === 'active' && !currentHasImage && !queuedImageFile) {
      setFormErrors((current) => ({
        ...current,
        imageFile: 'Debes cargar un banner antes de activar la campaña.',
      }))
      setError('La campaña necesita un banner antes de activarse.')
      return
    }

    if (!form.targetDevices.length) {
      setFormErrors((current) => ({
        ...current,
        targetDevices: 'Selecciona al menos un dispositivo.',
      }))
      setError('La campaña necesita al menos un dispositivo objetivo.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setFeedback('')
      setFormErrors({})
      setUploadProgress(0)

      const basePayload = buildCampaignPayload(form, {
        forceStatus: needsDeferredActivation ? 'draft' : null,
      })

      const persistedResponse = form.id
        ? await updateAdminCampaign(sessionState.token, form.id, basePayload)
        : await createAdminCampaign(sessionState.token, basePayload)

      let persistedCampaign = persistedResponse.campaign

      if (queuedImageFile) {
        const uploadResponse = await uploadAdminCampaignImage(
          sessionState.token,
          persistedCampaign.id,
          queuedImageFile,
          {
            imageAlt: form.imageAlt,
            onProgress: setUploadProgress,
          },
        )

        persistedCampaign = uploadResponse.campaign
      }

      if (needsDeferredActivation) {
        const activationResponse = await updateAdminCampaignStatus(sessionState.token, persistedCampaign.id, 'active')
        persistedCampaign = activationResponse.campaign
      }

      const refreshed = await refreshCampaigns()
      const freshCampaign = (refreshed.data ?? []).find((campaign) => campaign.id === persistedCampaign.id) ?? persistedCampaign
      openEdit(freshCampaign)
      setFeedback(form.id ? 'Campaña actualizada correctamente.' : 'Campaña creada correctamente.')
    } catch (saveError) {
      setFormErrors(mapFieldErrors(saveError.details))
      setError(saveError.message ?? getFirstFieldError(saveError.details) ?? 'No se pudo guardar la campaña.')
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleStatusChange = async (campaignId, status) => {
    try {
      setStatusActionId(`${campaignId}:${status}`)
      setError('')
      setFeedback('')
      const response = await updateAdminCampaignStatus(sessionState.token, campaignId, status)
      const refreshed = await refreshCampaigns()
      const freshCampaign = (refreshed.data ?? []).find((campaign) => campaign.id === response.campaign.id) ?? response.campaign
      if (form.id === campaignId) {
        openEdit(freshCampaign)
      }
      setFeedback('Estado de campaña actualizado correctamente.')
    } catch (statusError) {
      setError(statusError.message ?? 'No se pudo actualizar el estado de la campaña.')
    } finally {
      setStatusActionId('')
    }
  }

  const handleRemoveImage = async () => {
    if (!selectedCampaign?.id) return

    try {
      setSaving(true)
      setError('')
      setFeedback('')
      const response = await deleteAdminCampaignImage(sessionState.token, selectedCampaign.id)
      const refreshed = await refreshCampaigns()
      const freshCampaign = (refreshed.data ?? []).find((campaign) => campaign.id === response.campaign.id) ?? response.campaign
      openEdit(freshCampaign)
      setFeedback('Banner eliminado correctamente.')
    } catch (removeError) {
      setError(removeError.message ?? 'No se pudo eliminar el banner.')
    } finally {
      setSaving(false)
    }
  }

  if (!sessionState.loading && !roleCanManageCampaigns(sessionState.user?.role)) {
    return (
      <AdminPageShell
        title="Campañas"
        description="Promociones visuales del sitio con control editorial."
        sessionState={sessionState}
      >
        <div className="rounded-[32px] bg-white shadow-sm">
          <StatePanel
            title="Acceso restringido"
            message="Tu sesión puede entrar al panel, pero no tiene permisos para gestionar campañas promocionales."
            className="py-20"
          />
        </div>
      </AdminPageShell>
    )
  }

  const previewImageUrl = queuedImagePreview || selectedCampaign?.imageUrl || ''

  return (
    <AdminPageShell
      title="Campañas promocionales"
      description="Gestiona campañas promocionales del homepage con publicación controlada por prioridad, ventana activa y dispositivos objetivo."
      sessionState={sessionState}
      actions={(
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-[#0A0A0A] px-5 py-2.5 font-body text-sm text-white transition-colors hover:bg-[#222]"
        >
          Nueva campaña
        </button>
      )}
    >
      <FloatingToast
        message={feedback}
        onDismiss={() => setFeedback('')}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[32px] bg-white p-6 shadow-sm">
          <SectionLabel>Listado editorial</SectionLabel>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
              placeholder="Buscar por título, CTA o descripción"
              className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
              className="w-full rounded-2xl border border-[#ECECEC] px-4 py-3 font-body text-sm text-[#0A0A0A] focus:border-[#CFCFCF] focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-[#ffd6da] bg-[#FFF2F3] px-5 py-4 font-body text-sm text-[#b31a2b]" role="alert">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-[28px] border border-[#F1F1F1] p-5">
                    <div className="h-5 w-48 rounded-full bg-[#F2F2F2]" />
                    <div className="mt-4 h-4 w-full rounded-full bg-[#F5F5F5]" />
                    <div className="mt-2 h-4 w-5/6 rounded-full bg-[#F5F5F5]" />
                    <div className="mt-5 h-10 w-full rounded-2xl bg-[#F3F3F3]" />
                  </div>
                ))}
              </div>
            ) : campaigns.length ? campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className={`rounded-[28px] border p-5 transition-colors ${
                  form.id === campaign.id
                    ? 'border-[#0A0A0A] bg-[#FAFAFA]'
                    : 'border-[#F0F0F0] bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-2xl tracking-tight text-[#0A0A0A]">
                        {campaign.title}
                      </h2>
                      <span className={`inline-flex rounded-full px-3 py-1 font-body text-xs ${badgeClass(campaign.status)}`}>
                        {STATUS_OPTIONS.find((option) => option.value === campaign.status)?.label ?? campaign.status}
                      </span>
                      <span className="inline-flex rounded-full bg-[#F5F5F5] px-3 py-1 font-body text-xs text-[#555]">
                        Prioridad {campaign.priority}
                      </span>
                    </div>

                    <p className="mt-3 font-body text-sm leading-relaxed text-[#666]">
                      {campaign.description}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-[#F1F1F1] px-4 py-3">
                        <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#B5B5B5]">Ventana</p>
                        <p className="mt-2 font-body text-sm text-[#444]">
                          {campaign.startAt || campaign.endAt
                            ? `${formatDateTime(campaign.startAt)} → ${formatDateTime(campaign.endAt)}`
                            : 'Siempre disponible'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#F1F1F1] px-4 py-3">
                        <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#B5B5B5]">Frecuencia</p>
                        <p className="mt-2 font-body text-sm text-[#444]">
                          {FREQUENCY_OPTIONS.find((option) => option.value === campaign.frequencyRule)?.label ?? campaign.frequencyRule}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#F1F1F1] px-4 py-3">
                        <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#B5B5B5]">Ubicación</p>
                        <p className="mt-2 font-body text-sm text-[#444]">
                          Homepage ({HOMEPAGE_ROUTE})
                        </p>
                      </div>
                    </div>
                  </div>

                  {campaign.imageUrl ? (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.imageAlt || campaign.title}
                      className="h-28 w-full rounded-[24px] object-cover lg:w-52"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded-[24px] border border-dashed border-[#E6E6E6] bg-[#FCFCFC] font-body text-sm text-[#999] lg:w-52">
                      Sin banner
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(campaign)}
                    className="rounded-full border border-black/10 px-4 py-2 font-body text-sm text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A] hover:text-white"
                  >
                    Editar
                  </button>

                  {campaign.status !== 'active' ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(campaign.id, 'active')}
                      disabled={statusActionId === `${campaign.id}:active`}
                      className="rounded-full bg-[#0A0A0A] px-4 py-2 font-body text-sm text-white transition-colors hover:bg-[#222] disabled:opacity-60"
                    >
                      Activar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(campaign.id, 'paused')}
                      disabled={statusActionId === `${campaign.id}:paused`}
                      className="rounded-full border border-black/10 px-4 py-2 font-body text-sm text-[#0A0A0A] transition-colors hover:bg-[#F5F5F5] disabled:opacity-60"
                    >
                      Pausar
                    </button>
                  )}

                  {campaign.status !== 'draft' ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(campaign.id, 'draft')}
                      disabled={statusActionId === `${campaign.id}:draft`}
                      className="rounded-full border border-black/10 px-4 py-2 font-body text-sm text-[#666] transition-colors hover:bg-[#F5F5F5] disabled:opacity-60"
                    >
                      Volver a borrador
                    </button>
                  ) : null}

                  {campaign.status !== 'archived' ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(campaign.id, 'archived')}
                      disabled={statusActionId === `${campaign.id}:archived`}
                      className="rounded-full border border-[#ffd6da] px-4 py-2 font-body text-sm text-[#b31a2b] transition-colors hover:bg-[#FFF2F3] disabled:opacity-60"
                    >
                      Archivar
                    </button>
                  ) : null}
                </div>
              </article>
            )) : (
              <div className="rounded-[28px] border border-dashed border-[#E5E5E5] bg-[#FCFCFC]">
                <StatePanel
                  title="Sin campañas todavía"
                  message="Crea tu primera campaña promocional para el homepage y actívala cuando el banner esté listo."
                  actionLabel="Crear campaña"
                  onAction={openCreate}
                  className="py-20"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#F2F2F2] pt-5">
            <p className="font-body text-sm text-[#666]">
              {meta.total} campañas registradas
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                className="rounded-full border border-[#E6E6E6] px-4 py-2 font-body text-sm text-[#666] disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="font-body text-sm text-[#666]">Página {meta.page} de {meta.pages}</span>
              <button
                type="button"
                disabled={meta.page >= meta.pages}
                onClick={() => setFilters((current) => ({ ...current, page: Math.min(meta.pages, current.page + 1) }))}
                className="rounded-full border border-[#E6E6E6] px-4 py-2 font-body text-sm text-[#666] disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-[32px] bg-white p-6 shadow-sm">
          <SectionLabel>Configuración editorial</SectionLabel>
          <h2 className="font-heading text-[34px] tracking-tight text-[#0A0A0A]">
            {form.id ? 'Editar campaña' : 'Nueva campaña'}
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-[#666]">
            Prepara el copy del modal del homepage, define frecuencia y prioridad, y actívalo cuando el banner esté listo.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="font-body text-sm text-[#444]" htmlFor="campaign-title">Título</label>
              <input
                id="campaign-title"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                className={`${inputClass(Boolean(formErrors.title))} mt-2`}
                placeholder="Oferta de verano en SUVs premium"
              />
              <FieldError message={formErrors.title} />
            </div>

            <div>
              <label className="font-body text-sm text-[#444]" htmlFor="campaign-description">Descripción</label>
              <textarea
                id="campaign-description"
                rows={4}
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                className={`${inputClass(Boolean(formErrors.description))} mt-2 resize-none`}
                placeholder="Texto breve y claro para impulsar la acción del visitante."
              />
              <FieldError message={formErrors.description} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-cta-text">Texto CTA</label>
                <input
                  id="campaign-cta-text"
                  value={form.ctaText}
                  onChange={(event) => updateForm('ctaText', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.ctaText))} mt-2`}
                  placeholder="Ver inventario"
                />
                <FieldError message={formErrors.ctaText} />
              </div>

              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-cta-url">URL CTA</label>
                <input
                  id="campaign-cta-url"
                  value={form.ctaUrl}
                  onChange={(event) => updateForm('ctaUrl', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.ctaUrl))} mt-2`}
                  placeholder="/inventario o https://..."
                />
                <FieldError message={formErrors.ctaUrl} />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-[#444]" htmlFor="campaign-image-alt">Alt del banner</label>
              <input
                id="campaign-image-alt"
                value={form.imageAlt}
                onChange={(event) => updateForm('imageAlt', event.target.value)}
                className={`${inputClass(Boolean(formErrors.imageAlt))} mt-2`}
                placeholder="Promoción destacada Benzan Auto"
              />
              <FieldError message={formErrors.imageAlt} />
            </div>

            <div className="rounded-[28px] border border-[#F1F1F1] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body text-sm font-semibold text-[#0A0A0A]">Banner promocional</p>
                  <p className="mt-1 font-body text-xs text-[#777]">Se convierte a WebP y reemplaza el banner anterior si ya existe.</p>
                </div>
                {selectedCampaign?.imageUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="font-body text-xs text-[#b31a2b] transition-colors hover:text-[#8f1120]"
                  >
                    Quitar banner
                  </button>
                ) : null}
              </div>

              <div className="mt-4">
                <label
                  htmlFor="campaign-image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DDDDDD] bg-[#FCFCFC] px-5 py-10 text-center transition-colors hover:border-[#BBBBBB]"
                >
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={form.imageAlt || form.title || 'Vista previa del banner'}
                      className="h-44 w-full rounded-[20px] object-cover"
                    />
                  ) : (
                    <>
                      <span className="font-body text-sm font-semibold text-[#0A0A0A]">Selecciona un banner</span>
                      <span className="mt-2 font-body text-xs text-[#777]">JPG, PNG o WebP. Se usará en modal promocional.</span>
                    </>
                  )}
                </label>
                <input
                  id="campaign-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="sr-only"
                />
                {queuedImageFile ? (
                  <p className="mt-3 font-body text-xs text-[#666]">
                    Listo para subir: <span className="font-semibold text-[#0A0A0A]">{queuedImageFile.name}</span>
                  </p>
                ) : null}
                {uploadProgress > 0 && uploadProgress < 100 ? (
                  <div className="mt-3 overflow-hidden rounded-full bg-[#F2F2F2]">
                    <div
                      className="h-2 rounded-full bg-[#0A0A0A] transition-[width] duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                ) : null}
                <FieldError message={formErrors.imageFile} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-status">Estado</label>
                <select
                  id="campaign-status"
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.status))} mt-2`}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={formErrors.status} />
              </div>

              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-display-type">Formato</label>
                <select
                  id="campaign-display-type"
                  value={form.displayType}
                  onChange={(event) => updateForm('displayType', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.displayType))} mt-2`}
                >
                  {DISPLAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={formErrors.displayType} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-start-at">Inicio</label>
                <input
                  id="campaign-start-at"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => updateForm('startAt', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.startAt))} mt-2`}
                />
                <FieldError message={formErrors.startAt} />
              </div>

              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-end-at">Fin</label>
                <input
                  id="campaign-end-at"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => updateForm('endAt', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.endAt))} mt-2`}
                />
                <FieldError message={formErrors.endAt} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-delay">Delay (segundos)</label>
                <input
                  id="campaign-delay"
                  type="number"
                  min="0"
                  max="120"
                  value={form.delaySeconds}
                  onChange={(event) => updateForm('delaySeconds', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.delaySeconds))} mt-2`}
                />
                <FieldError message={formErrors.delaySeconds} />
              </div>

              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-priority">Prioridad</label>
                <input
                  id="campaign-priority"
                  type="number"
                  min="0"
                  max="1000"
                  value={form.priority}
                  onChange={(event) => updateForm('priority', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.priority))} mt-2`}
                />
                <FieldError message={formErrors.priority} />
              </div>

              <div>
                <label className="font-body text-sm text-[#444]" htmlFor="campaign-frequency">Frecuencia</label>
                <select
                  id="campaign-frequency"
                  value={form.frequencyRule}
                  onChange={(event) => updateForm('frequencyRule', event.target.value)}
                  className={`${inputClass(Boolean(formErrors.frequencyRule))} mt-2`}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={formErrors.frequencyRule} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#F1F1F1] bg-[#FCFCFC] px-5 py-4">
              <p className="font-body text-sm text-[#444]">Ubicación pública</p>
              <p className="mt-2 font-body text-sm text-[#0A0A0A]">
                Esta campaña promocional se muestra exclusivamente en el homepage ({HOMEPAGE_ROUTE}).
              </p>
              <p className="mt-2 font-body text-xs text-[#777]">
                La experiencia se controla para no interrumpir al usuario en páginas internas del portal.
              </p>
            </div>

            <div>
              <p className="font-body text-sm text-[#444]">Dispositivos objetivo</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEVICE_OPTIONS.map((option) => {
                  const active = form.targetDevices.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleDevice(option.value)}
                      className={[
                        'rounded-full border px-4 py-2 font-body text-sm transition-colors',
                        active
                          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                          : 'border-[#E6E6E6] text-[#666] hover:bg-[#F5F5F5]',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <FieldError message={formErrors.targetDevices} />
            </div>

            {selectedCampaign ? (
              <div className="rounded-[28px] border border-[#F1F1F1] bg-[#FCFCFC] p-5">
                <SectionLabel>Resumen actual</SectionLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="font-body text-sm text-[#777]">Estado</p>
                    <p className="mt-1 font-body text-sm font-semibold text-[#0A0A0A]">
                      {STATUS_OPTIONS.find((option) => option.value === selectedCampaign.status)?.label ?? selectedCampaign.status}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-sm text-[#777]">Última actualización</p>
                    <p className="mt-1 font-body text-sm font-semibold text-[#0A0A0A]">
                      {formatDateTime(selectedCampaign.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0A0A0A] px-6 py-3 font-body text-sm text-white transition-colors hover:bg-[#222] disabled:opacity-60"
              >
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear campaña'}
              </button>

              {form.id ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded-full border border-black/10 px-6 py-3 font-body text-sm text-[#666] transition-colors hover:bg-[#F5F5F5]"
                >
                  Nueva campaña
                </button>
              ) : null}
            </div>
          </form>
        </aside>
      </div>
    </AdminPageShell>
  )
}
