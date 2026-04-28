import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { vehicles } from '../data/vehicles'
import VehicleCard from '../components/ui/VehicleCard'
import { buildWhatsAppUrl } from '../../shared/company.js'

/* ── helpers ── */
const fmt = (p) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p)

/* ── Collapsible filter section ── */
function FilterSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-neutral-200 py-5">
      <button
        onClick={() => setOpen(v => !v)}
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
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
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-4 h-4 border flex items-center justify-center transition-colors ${
            checked ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300 group-hover:border-neutral-500'
          }`}
          onClick={onChange}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="font-body text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">{label}</span>
      </div>
      {count != null && (
        <span className="font-body text-xs text-neutral-400">{count}</span>
      )}
    </label>
  )
}

function parseMultiValue(searchParams, key, allowedValues) {
  return [...new Set(
    searchParams
      .getAll(key)
      .map((value) => value.trim())
      .filter((value) => allowedValues.includes(value)),
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

function parseInventoryFilters(searchParams, { allBrands, allCategories, allFuels }) {
  return {
    statusFilter: parseSingleValue(searchParams, 'estado', ['Todos', 'Nuevo', 'Usado'], 'Todos'),
    brands: parseMultiValue(searchParams, 'marca', allBrands),
    categories: [
      ...new Set([
        ...parseMultiValue(searchParams, 'tipo', allCategories),
        ...parseMultiValue(searchParams, 'categoria', allCategories),
      ]),
    ],
    fuels: parseMultiValue(searchParams, 'combustible', allFuels),
    maxPrice: parsePositiveInteger(searchParams, 'precioMax'),
    sortBy: parseSingleValue(searchParams, 'orden', ['default', 'price-asc', 'price-desc', 'year'], 'default'),
  }
}

function buildInventorySearchParams({ statusFilter, brands, categories, fuels, maxPrice, sortBy }) {
  const nextParams = new URLSearchParams()

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

/* ════════════════════════════════════════════════ */

export default function Inventario() {
  const [searchParams, setSearchParams] = useSearchParams()

  /* derived option lists */
  const allBrands = useMemo(() => [...new Set(vehicles.map(v => v.brand))], [])
  const allCategories = useMemo(() => [...new Set(vehicles.map(v => v.category))], [])
  const allFuels = useMemo(() => [...new Set(vehicles.map(v => v.fuel))], [])
  const filters = useMemo(() => parseInventoryFilters(searchParams, {
    allBrands,
    allCategories,
    allFuels,
  }), [allBrands, allCategories, allFuels, searchParams])
  const { statusFilter, brands, categories, fuels, maxPrice, sortBy } = filters

  const updateFilters = (updater) => {
    const nextFilters = typeof updater === 'function' ? updater(filters) : { ...filters, ...updater }
    const nextParams = buildInventorySearchParams(nextFilters)

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }

  const toggleFilter = (key, value) => {
    updateFilters((currentFilters) => ({
      ...currentFilters,
      [key]: toggleListValue(currentFilters[key], value),
    }))
  }

  const filtered = useMemo(() => {
    let r = [...vehicles]
    if (statusFilter !== 'Todos')   r = r.filter(v => v.status === statusFilter)
    if (brands.length)              r = r.filter(v => brands.includes(v.brand))
    if (categories.length)          r = r.filter(v => categories.includes(v.category))
    if (fuels.length)               r = r.filter(v => fuels.includes(v.fuel))
    if (maxPrice)                   r = r.filter(v => v.price <= maxPrice)
    if (sortBy === 'price-asc')     r.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc')    r.sort((a, b) => b.price - a.price)
    if (sortBy === 'year')          r.sort((a, b) => b.year - a.year)
    return r
  }, [statusFilter, brands, categories, fuels, maxPrice, sortBy])

  /* count helpers */
  const countFor = (field, val) =>
    vehicles.filter(v =>
      (statusFilter === 'Todos' || v.status === statusFilter) &&
      v[field] === val
    ).length

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const activeFilters = [
    statusFilter !== 'Todos' ? statusFilter : null,
    ...brands,
    ...categories,
    ...fuels,
    maxPrice ? `Hasta ${fmt(maxPrice)}` : null,
  ].filter(Boolean)

  return (
    <div className="bg-white min-h-screen pt-[72px]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* ── Top header ── */}
        <div className="flex items-center justify-between py-8 border-b border-neutral-200">
          <h1 className="font-body text-3xl font-semibold text-neutral-900 tracking-tight">
            Inventario
          </h1>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => updateFilters({ sortBy: e.target.value })}
              className="font-body text-sm text-neutral-700 border-0 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23737373\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '16px' }}
            >
              <option value="default">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="year">Año: más reciente</option>
            </select>
          </div>
        </div>

        {/* ── Body: sidebar + grid ── */}
        <div className="flex gap-10 py-8">

          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:block w-60 flex-shrink-0">

            {/* Nuevo / Usado tab */}
            <div className="flex border border-neutral-200 mb-6 overflow-hidden">
              {['Todos', 'Nuevo', 'Usado'].map(s => (
                <button
                  key={s}
                  onClick={() => updateFilters({ statusFilter: s })}
                  className={`flex-1 font-body text-sm py-2.5 transition-colors duration-150 ${
                    statusFilter === s
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Marca */}
            <FilterSection label="Marca" defaultOpen={true}>
              {allBrands.map(b => (
                <CheckRow
                  key={b}
                  label={b}
                  count={countFor('brand', b)}
                  checked={brands.includes(b)}
                  onChange={() => toggleFilter('brands', b)}
                />
              ))}
            </FilterSection>

            {/* Categoría */}
            <FilterSection label="Categoría" defaultOpen={true}>
              {allCategories.map(c => (
                <CheckRow
                  key={c}
                  label={c}
                  count={countFor('category', c)}
                  checked={categories.includes(c)}
                  onChange={() => toggleFilter('categories', c)}
                />
              ))}
            </FilterSection>

            {/* Combustible */}
            <FilterSection label="Combustible" defaultOpen={false}>
              {allFuels.map(f => (
                <CheckRow
                  key={f}
                  label={f}
                  count={countFor('fuel', f)}
                  checked={fuels.includes(f)}
                  onChange={() => toggleFilter('fuels', f)}
                />
              ))}
            </FilterSection>

            {/* Reset */}
            {(brands.length || categories.length || fuels.length || statusFilter !== 'Todos' || maxPrice) > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 w-full font-body text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </aside>

          {/* ── GRID ── */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 mb-6">
              <p className="font-body text-sm text-neutral-500">
                {filtered.length} vehículo{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
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
                    onClick={resetFilters}
                    className="font-body text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((v, i) => (
                  <VehicleCard key={v.id} vehicle={v} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="font-body text-neutral-400 text-sm mb-2">Sin vehículos con esos filtros.</p>
                <button
                  onClick={resetFilters}
                  className="font-body text-sm text-neutral-900 underline underline-offset-2 mt-2"
                >
                  Ver todo el inventario
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CTA bottom ── */}
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
