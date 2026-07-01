import { startTransition, useDeferredValue, useEffect, useId, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import VehicleCard from '../components/ui/VehicleCard'
import StatePanel from '../components/ui/StatePanel'
import SeoMeta from '../components/seo/SeoMeta'
import { buildWhatsAppUrl } from '../../shared/company.js'
import { listPublicVehicles } from '../lib/publicApi'
import { buildBreadcrumbStructuredData, buildInventoryItemListStructuredData } from '../lib/seoStructuredData'

const fmt = (price) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)

function useDebouncedValue(value, delayMs = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
}

function FilterSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const sectionId = useId()
  const reduceMotion = useReducedMotion()

  return (
    <div className="border-b border-neutral-200 py-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={sectionId}
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-body text-sm font-semibold text-neutral-900 tracking-wide">{label}</span>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={sectionId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckRow({ label, count, checked, onChange }) {
  return (
    <label className="group flex cursor-pointer items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="flex h-4 w-4 items-center justify-center border border-neutral-300 transition-colors peer-checked:border-neutral-900 peer-checked:bg-neutral-900 group-hover:border-neutral-500"
          >
            {checked ? (
              <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </span>
        </span>
        <span className="font-body text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">{label}</span>
      </div>
      {count != null && (
        <span className="font-body text-xs text-neutral-400">{count}</span>
      )}
    </label>
  )
}

function parseMultiValue(searchParams, key, allowedValues = null) {
  return [...new Set(
    searchParams
      .getAll(key)
      .map((value) => value.trim())
      .filter((value) => value && (!allowedValues || allowedValues.includes(value))),
  )]
}

function parseSingleValue(searchParams, key, allowedValues, fallback) {
  const value = searchParams.get(key)?.trim()
  return value && allowedValues.includes(value) ? value : fallback
}

function parsePositiveInteger(searchParams, key) {
  const rawValue = searchParams.get(key)
  if (!rawValue) return null

  const parsed = Number.parseInt(rawValue, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function parseInventoryFilters(searchParams) {
  return {
    searchQuery: searchParams.get('q')?.trim() ?? '',
    statusFilter: parseSingleValue(searchParams, 'estado', ['Todos', 'Nuevo', 'Usado'], 'Todos'),
    brands: parseMultiValue(searchParams, 'marca'),
    categories: [
      ...new Set([
        ...parseMultiValue(searchParams, 'tipo'),
        ...parseMultiValue(searchParams, 'categoria'),
      ]),
    ],
    fuels: parseMultiValue(searchParams, 'combustible'),
    maxPrice: parsePositiveInteger(searchParams, 'precioMax'),
    sortBy: parseSingleValue(searchParams, 'orden', ['default', 'price-asc', 'price-desc', 'year'], 'default'),
  }
}

function buildInventorySearchParams({ searchQuery, statusFilter, brands, categories, fuels, maxPrice, sortBy }) {
  const nextParams = new URLSearchParams()

  if (searchQuery?.trim()) nextParams.set('q', searchQuery.trim())
  if (statusFilter !== 'Todos') nextParams.set('estado', statusFilter)
  brands.forEach((brand) => nextParams.append('marca', brand))
  categories.forEach((category) => nextParams.append('tipo', category))
  fuels.forEach((fuel) => nextParams.append('combustible', fuel))
  if (maxPrice) nextParams.set('precioMax', String(maxPrice))
  if (sortBy !== 'default') nextParams.set('orden', sortBy)

  return nextParams
}

function toggleListValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function normalizeFacets(facets) {
  return {
    brands: facets?.brands ?? [],
    bodyTypes: facets?.bodyTypes ?? [],
    fuelTypes: facets?.fuelTypes ?? [],
    conditions: facets?.conditions ?? [],
  }
}

function formatInventoryError(error) {
  if (error?.status === 429) {
    return 'Estamos actualizando el inventario. Intenta otra vez en unos segundos.'
  }

  return error?.message ?? 'No se pudo cargar el inventario.'
}

export default function Inventario() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState([])
  const [meta, setMeta] = useState({ total: 0 })
  const [facets, setFacets] = useState(normalizeFacets(null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryNonce, setRetryNonce] = useState(0)

  const searchParamsKey = searchParams.toString()

  const allBrands = useMemo(() => facets.brands.map((item) => item.value), [facets.brands])
  const allCategories = useMemo(() => facets.bodyTypes.map((item) => item.value), [facets.bodyTypes])
  const allFuels = useMemo(() => facets.fuelTypes.map((item) => item.value), [facets.fuelTypes])
  const filters = useMemo(
    () => parseInventoryFilters(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  )
  const { searchQuery, statusFilter, brands, categories, fuels, maxPrice, sortBy } = filters
  const [searchInput, setSearchInput] = useState(searchQuery)
  const deferredSearchInput = useDeferredValue(searchInput)
  const debouncedSearchInput = useDebouncedValue(deferredSearchInput, 350)

  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  const currentFilterSnapshot = useMemo(
    () => ({
      ...filters,
      searchQuery: searchInput,
    }),
    [filters, searchInput],
  )

  const updateFilters = (updater) => {
    const nextFilters = typeof updater === 'function'
      ? updater(currentFilterSnapshot)
      : { ...currentFilterSnapshot, ...updater }
    const nextParams = buildInventorySearchParams(nextFilters)

    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }

  const toggleFilter = (key, value) => {
    updateFilters((currentFilters) => ({
      ...currentFilters,
      [key]: toggleListValue(currentFilters[key], value),
    }))
  }

  useEffect(() => {
    const normalizedSearch = debouncedSearchInput.trim()
    if (normalizedSearch === searchQuery) return

    const nextParams = buildInventorySearchParams({
      ...filters,
      searchQuery: normalizedSearch,
    })

    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [debouncedSearchInput, filters, searchQuery, searchParamsKey, setSearchParams])

  const requestParams = useMemo(() => ({
    limit: 60,
    q: searchQuery || undefined,
    estado: statusFilter !== 'Todos' ? [statusFilter] : undefined,
    marca: brands,
    tipo: categories,
    combustible: fuels,
    precioMax: maxPrice || undefined,
    orden: sortBy,
  }), [brands, categories, fuels, maxPrice, searchQuery, sortBy, statusFilter])

  const requestKey = useMemo(() => JSON.stringify(requestParams), [requestParams])
  const inventorySeo = useMemo(() => {
    const activeBrandsLabel = brands.slice(0, 2).join(', ')
    const inventoryTitle = searchQuery
      ? `Inventario: ${searchQuery}`
      : activeBrandsLabel
        ? `Inventario de ${activeBrandsLabel}`
        : 'Inventario de vehículos nuevos y usados'

    const inventoryDescription = [
      meta.total > 0
        ? `${meta.total} vehículos disponibles en Benzan Auto Import.`
        : 'Explora el inventario actualizado de Benzan Auto Import.',
      searchQuery ? `Búsqueda activa: ${searchQuery}.` : null,
      statusFilter !== 'Todos' ? `Estado filtrado: ${statusFilter}.` : null,
      brands.length > 0 ? `Marcas: ${brands.join(', ')}.` : null,
      categories.length > 0 ? `Categorías: ${categories.join(', ')}.` : null,
      fuels.length > 0 ? `Combustibles: ${fuels.join(', ')}.` : null,
      'Filtra por marca, categoría, combustible y precio desde el inventario público.',
    ]
      .filter(Boolean)
      .join(' ')

    return {
      title: inventoryTitle,
      description: inventoryDescription,
      jsonLd: [
        buildBreadcrumbStructuredData([
          { name: 'Inicio', path: '/' },
          { name: 'Inventario', path: '/inventario' },
        ]),
        buildInventoryItemListStructuredData(vehicles),
      ],
    }
  }, [brands, categories, fuels, meta.total, searchQuery, statusFilter, vehicles])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    async function loadVehicles() {
      try {
        setLoading(true)
        setError('')

        const response = await listPublicVehicles(requestParams, {
          signal: controller.signal,
        })

        if (ignore || controller.signal.aborted) return

        startTransition(() => {
          setVehicles(response.data)
          setMeta(response.meta)
          setFacets(normalizeFacets(response.facets))
        })
      } catch (loadError) {
        if (!ignore && !controller.signal.aborted) {
          startTransition(() => {
            setError(formatInventoryError(loadError))
          })
        }
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadVehicles()
    return () => {
      ignore = true
      controller.abort()
    }
  }, [requestKey, requestParams, retryNonce])

  const countFor = (facetName, value) =>
    facets[facetName]?.find((item) => item.value === value)?.count ?? 0

  const resetFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const activeFilters = [
    searchQuery ? `Búsqueda: "${searchQuery}"` : null,
    statusFilter !== 'Todos' ? statusFilter : null,
    ...brands,
    ...categories,
    ...fuels,
    maxPrice ? `Hasta ${fmt(maxPrice)}` : null,
  ].filter(Boolean)

  return (
    <div className="bg-white min-h-screen pt-[72px]">
      <SeoMeta
        title={inventorySeo.title}
        description={inventorySeo.description}
        pathname="/inventario"
        jsonLd={inventorySeo.jsonLd}
      />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col gap-4 py-8 border-b border-neutral-200 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-body text-3xl font-semibold text-neutral-900 tracking-tight">
              Inventario
            </h1>
            <p className="font-body text-sm text-neutral-500 mt-2">
              Busca por marca, modelo o palabra clave y combina filtros en tiempo real.
            </p>
          </div>

          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="relative block min-w-[280px]">
              <span className="sr-only">Buscar vehículo</span>
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar Toyota, Prado, diesel..."
                className="w-full border border-neutral-200 bg-white py-3 pl-11 pr-10 font-body text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                aria-describedby="inventory-search-hint"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-900"
                  aria-label="Limpiar búsqueda"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </label>
            <span id="inventory-search-hint" className="sr-only">
              La búsqueda se aplica automáticamente mientras escribes.
            </span>

            <select
              aria-label="Ordenar vehículos"
              value={sortBy}
              onChange={(event) => updateFilters({ sortBy: event.target.value })}
              className="font-body text-sm text-neutral-700 border-0 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23737373\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '16px' }}
            >
              <option value="default">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="year">Año: más reciente</option>
            </select>
          </form>
        </div>

        <div className="flex gap-10 py-8">
          <aside className="hidden lg:block w-60 flex-shrink-0" aria-label="Filtros del inventario">
            <div className="flex border border-neutral-200 mb-6 overflow-hidden">
              {['Todos', 'Nuevo', 'Usado'].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => updateFilters({ statusFilter: status })}
                  aria-pressed={statusFilter === status}
                  className={`flex-1 font-body text-sm py-2.5 transition-colors duration-150 ${
                    statusFilter === status
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <FilterSection label="Marca" defaultOpen>
              {allBrands.map((brand) => (
                <CheckRow
                  key={brand}
                  label={brand}
                  count={countFor('brands', brand)}
                  checked={brands.includes(brand)}
                  onChange={() => toggleFilter('brands', brand)}
                />
              ))}
            </FilterSection>

            <FilterSection label="Categoría" defaultOpen>
              {allCategories.map((category) => (
                <CheckRow
                  key={category}
                  label={category}
                  count={countFor('bodyTypes', category)}
                  checked={categories.includes(category)}
                  onChange={() => toggleFilter('categories', category)}
                />
              ))}
            </FilterSection>

            <FilterSection label="Combustible" defaultOpen={false}>
              {allFuels.map((fuel) => (
                <CheckRow
                  key={fuel}
                  label={fuel}
                  count={countFor('fuelTypes', fuel)}
                  checked={fuels.includes(fuel)}
                  onChange={() => toggleFilter('fuels', fuel)}
                />
              ))}
            </FilterSection>

            {(searchQuery || brands.length || categories.length || fuels.length || statusFilter !== 'Todos' || maxPrice) > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 w-full font-body text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                Limpiar búsqueda y filtros
              </button>
            )}
          </aside>

          <section className="flex-1 min-w-0" aria-labelledby="inventory-results-heading" aria-busy={loading}>
            <div className="flex flex-col gap-3 mb-6">
              <h2 id="inventory-results-heading" className="sr-only">
                Resultados del inventario
              </h2>
              <p className="font-body text-sm text-neutral-500" role="status" aria-live="polite">
                {loading && vehicles.length === 0
                  ? 'Cargando inventario...'
                  : `${meta.total} vehículo${meta.total !== 1 ? 's' : ''} disponible${meta.total !== 1 ? 's' : ''}`}
              </p>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center px-3 py-1 text-xs font-body text-neutral-700 border border-neutral-200 bg-neutral-50"
                    >
                      {label}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="font-body text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                  >
                    Limpiar búsqueda y filtros
                  </button>
                </div>
              )}

              {error && vehicles.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3" role="status" aria-live="polite">
                  <p className="font-body text-sm text-amber-800">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {!loading && !error && vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehicles.map((vehicle, index) => (
                  <VehicleCard key={vehicle.slug ?? vehicle.id} vehicle={vehicle} index={index} />
                ))}
              </div>
            ) : loading && vehicles.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" role="status" aria-live="polite">
                <span className="sr-only">Cargando tarjetas del inventario.</span>
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item} aria-hidden="true" className="border border-neutral-200 bg-neutral-50 animate-pulse min-h-[380px]" />
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehicles.map((vehicle, index) => (
                  <VehicleCard key={vehicle.slug ?? vehicle.id} vehicle={vehicle} index={index} />
                ))}
              </div>
            ) : error ? (
              <StatePanel
                title="Inventario no disponible"
                message={error}
                actionLabel="Reintentar"
                onAction={() => setRetryNonce((current) => current + 1)}
                role="alert"
                announcementMode="assertive"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="font-body text-neutral-400 text-sm mb-2">Sin vehículos con esos filtros.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-body text-sm text-neutral-900 underline underline-offset-2 mt-2"
                >
                  Ver todo el inventario
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-neutral-200 py-16 text-center">
          <p className="font-body text-neutral-500 text-sm mb-2">¿No encuentras el vehículo que buscas?</p>
          <h3 className="font-body text-2xl font-semibold text-neutral-900 mb-6">
            Consúltanos y lo conseguimos.
          </h3>
          <a
            href={buildWhatsAppUrl('Hola, busco un vehículo específico')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-700 text-white font-body text-sm px-8 py-3.5 transition-colors duration-200"
          >
            Hablar con un asesor
          </a>
        </div>
      </div>
    </div>
  )
}
