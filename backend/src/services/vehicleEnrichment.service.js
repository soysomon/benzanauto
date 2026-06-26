import VehicleTemplate from '../models/VehicleTemplate.js'

const CARQUERY_BASE = 'https://www.carqueryapi.com/api/0.3/'
const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'
const FETCH_TIMEOUT_MS = 8_000

const TTL_DAYS_MAKES = 30
const TTL_DAYS_MODELS = 30
const TTL_DAYS_TRIMS = 30
const TTL_DAYS_VIN = 90

// Curated fallback — covers the Dominican market + common imports
const FALLBACK_MAKES = [
  'Acura', 'Alfa Romeo', 'Audi',
  'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Citroën',
  'Daihatsu', 'Dodge',
  'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC',
  'Honda', 'Hyundai',
  'Infiniti', 'Isuzu',
  'Jaguar', 'Jeep',
  'Kia',
  'Land Rover', 'Lexus', 'Lincoln',
  'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi',
  'Nissan',
  'Peugeot', 'Porsche',
  'RAM', 'Renault',
  'Subaru', 'Suzuki',
  'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
]

// Curated model fallback for brands most common in DR
const FALLBACK_MODELS = {
  'Toyota': ['4Runner', 'Camry', 'Corolla', 'Fortuner', 'Highlander', 'Hilux', 'Land Cruiser', 'Prado', 'RAV4', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra', 'Yaris'],
  'Honda': ['Accord', 'CR-V', 'Element', 'Fit', 'HR-V', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline', 'Civic'],
  'Hyundai': ['Accent', 'Azera', 'Creta', 'Elantra', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Cruz', 'Santa Fe', 'Sonata', 'Tucson', 'Veloster'],
  'Kia': ['Carnival', 'Cerato', 'EV6', 'K5', 'Niro', 'Rio', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Telluride'],
  'Nissan': ['Altima', 'Armada', 'Frontier', 'Kicks', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Titan', 'Versa', 'X-Trail'],
  'Mazda': ['CX-3', 'CX-30', 'CX-5', 'CX-9', 'CX-90', 'Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5 Miata'],
  'Mitsubishi': ['ASX', 'Eclipse Cross', 'L200', 'Lancer', 'Montero', 'Outlander', 'Pajero', 'Xpander'],
  'Suzuki': ['Baleno', 'Grand Vitara', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara'],
  'Ford': ['Bronco', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'Maverick', 'Mustang', 'Ranger', 'Territory'],
  'Chevrolet': ['Blazer', 'Camaro', 'Colorado', 'Equinox', 'Express', 'Silverado', 'Suburban', 'Tahoe', 'Trail Blazer', 'Traverse'],
  'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Grand Wagoneer', 'Renegade', 'Wrangler'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'M3', 'M5', 'X1', 'X2', 'X3', 'X5', 'X6', 'X7'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class'],
  'Lexus': ['ES', 'GX', 'IS', 'LC', 'LX', 'NX', 'RX', 'UX'],
  'Volkswagen': ['Atlas', 'Golf', 'ID.4', 'Jetta', 'Passat', 'Taos', 'Tiguan', 'Touareg'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'RS5', 'S4'],
  'Subaru': ['Ascent', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  'Dodge': ['Challenger', 'Charger', 'Durango', 'Ram 1500'],
  'RAM': ['1500', '2500', '3500', 'ProMaster'],
  'Acura': ['MDX', 'RDX', 'TLX'],
  'Infiniti': ['Q50', 'QX55', 'QX60', 'QX80'],
  'GMC': ['Acadia', 'Canyon', 'Sierra 1500', 'Terrain', 'Yukon'],
  'Volvo': ['S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90'],
  'Porsche': ['Cayenne', 'Macan', 'Panamera', 'Taycan'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Renault': ['Duster', 'Fluence', 'Koleos', 'Logan', 'Sandero', 'Stepway'],
  'Peugeot': ['2008', '3008', '5008', '208'],
  'Isuzu': ['D-Max', 'MU-X', 'Trooper'],
  'Daihatsu': ['Boon', 'Hijet', 'Rocky', 'Terios'],
  'Buick': ['Enclave', 'Encore', 'Encore GX', 'Envision'],
  'Cadillac': ['CT5', 'Escalade', 'XT4', 'XT5', 'XT6'],
  'Lincoln': ['Aviator', 'Corsair', 'Navigator'],
  'Mini': ['Clubman', 'Countryman', 'Cooper', 'Paceman'],
  'Genesis': ['G70', 'G80', 'G90', 'GV70', 'GV80'],
}

// ── Normalization ─────────────────────────────────────────────────────────

function normalizeBodyType(val) {
  if (!val) return null
  const v = val.toLowerCase().trim()
  if (v.includes('sport utility') || v.includes('suv')) return 'SUV'
  if (v.includes('pickup') || v.includes('truck')) return 'Pickup'
  if (v.includes('hatchback') || v.includes('liftback') || v.includes('notchback')) return 'Hatchback'
  if (v.includes('crossover')) return 'Crossover'
  if (v.includes('sedan') || v.includes('saloon')) return 'Sedan'
  if (v.includes('convertible') || v.includes('cabriolet')) return 'Coupe'
  if (v.includes('coupe')) return 'Coupe'
  if (v.includes('minivan') || v.includes('cargo van') || v.includes('passenger van') || v.includes('van')) return 'Van'
  if (v.includes('wagon')) return 'Wagon'
  return null
}

function normalizeFuelType(val) {
  if (!val) return null
  const v = val.toLowerCase().trim()
  if (v.includes('diesel')) return 'Diesel'
  if (v.includes('plug-in') || v.includes('plug in')) return 'Híbrido'
  if (v.includes('hybrid')) return 'Híbrido'
  if (v.includes('electric')) return 'Eléctrico'
  if (v.includes('natural gas') || v.includes('cng')) return 'Gas natural'
  if (v.includes('lpg') || v.includes('propane') || v.includes('liquif')) return 'GLP'
  if (v.includes('flex') || v.includes('gasoline') || v.includes('petrol') || v === 'gas') return 'Gasolina'
  return null
}

function normalizeTransmission(val) {
  if (!val) return null
  const v = val.toLowerCase().trim()
  if (v.includes('e-cvt') || v.includes('ecvt')) return 'eCVT'
  if (v.includes('cvt') || v.includes('continuously variable')) return 'CVT'
  if (v.includes('dual clutch') || v.includes('dct')) return 'DCT'
  if (v.includes('semi') || v.includes('automated manual') || v === 'amt') return 'Semi-automático'
  if (v.includes('automatic') || v.includes('auto')) return 'Automático'
  if (v.includes('manual')) return 'Manual'
  return null
}

function normalizeDrivetrain(val) {
  if (!val) return null
  const v = val.toLowerCase().trim()
  if (v.includes('awd') || v.includes('all wheel') || v.includes('all-wheel')) return 'AWD'
  if (v.includes('4wd') || v.includes('4x4') || v.includes('four wheel') || v.includes('four-wheel')) return '4x4'
  if (v.includes('fwd') || v.includes('front wheel') || v.includes('front-wheel') || v === 'front') return 'FWD'
  if (v.includes('rwd') || v.includes('rear wheel') || v.includes('rear-wheel') || v === 'rear') return 'RWD'
  if (v === '2wd' || v.includes('2-wheel')) return 'FWD'
  return null
}

function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Cache helpers ─────────────────────────────────────────────────────────

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function getCached(key) {
  try {
    const doc = await VehicleTemplate.findOne({ cacheKey: key })
    if (!doc) return null
    if (doc.expiresAt < new Date()) return null
    return doc.data
  } catch {
    return null
  }
}

async function setCache(key, type, source, data, ttlDays) {
  try {
    await VehicleTemplate.findOneAndUpdate(
      { cacheKey: key },
      { cacheKey: key, type, source, data, expiresAt: daysFromNow(ttlDays) },
      { upsert: true, new: true },
    )
  } catch {
    // non-critical — cache failure should not break the response
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function fetchCarQuery(params) {
  const search = new URLSearchParams({ ...params, callback: 'q' }).toString()
  const url = `${CARQUERY_BASE}?${search}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`CarQuery HTTP ${res.status}`)
  const body = await res.text()
  // Strip JSONP wrapper: q({...});
  const json = body.replace(/^\w+\s*\(/, '').replace(/\);\s*$/, '')
  return JSON.parse(json)
}

// ── Stat helper: pick most common non-null value across trims ─────────────

function mostCommon(trims, extract, normalize) {
  const counts = {}
  for (const t of trims) {
    const normalized = normalize(extract(t))
    if (normalized) counts[normalized] = (counts[normalized] ?? 0) + 1
  }
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  return sorted[0] ?? null
}

// ── Make ID resolution ────────────────────────────────────────────────────

async function resolveMakeId(displayName) {
  // Try to resolve from the cached makes list (fastest path after first load)
  const cached = await getCached('makes')
  if (cached?.makes) {
    const found = cached.makes.find(
      (m) => m.name.toLowerCase() === displayName.toLowerCase(),
    )
    if (found?.id) return found.id
  }
  // Fallback heuristic: lowercase + spaces → hyphens (works for most CarQuery IDs)
  return displayName.toLowerCase().replace(/\s+/g, '-')
}

// ── Public API ────────────────────────────────────────────────────────────

export async function getMakes() {
  const cached = await getCached('makes')
  if (cached) return cached

  try {
    const data = await fetchCarQuery({ cmd: 'getMakes' })
    const makes = (data.Makes ?? [])
      .map((m) => ({ id: m.make_id, name: m.make_display }))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (makes.length > 0) {
      const result = { makes }
      await setCache('makes', 'makes', 'carquery', result, TTL_DAYS_MAKES)
      return result
    }
  } catch {
    // fall through to hardcoded fallback
  }

  const result = {
    makes: FALLBACK_MAKES.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
    })),
  }
  await setCache('makes', 'makes', 'fallback', result, 1)
  return result
}

export async function getModels(make) {
  if (!make) return { models: [] }

  const cacheKey = `models:${make.toLowerCase().replace(/\s+/g, '_')}`
  const cached = await getCached(cacheKey)
  if (cached) return cached

  // Resolve the CarQuery make_id before calling the API
  const makeId = await resolveMakeId(make)

  try {
    const data = await fetchCarQuery({ cmd: 'getModels', make: makeId, full_results: '1' })
    const models = (data.Models ?? [])
      .map((m) => ({
        name: m.model_name,
        yearBegin: Number(m.model_year_begin) || 0,
        yearEnd: Number(m.model_year_end) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (models.length > 0) {
      const result = { models }
      await setCache(cacheKey, 'models', 'carquery', result, TTL_DAYS_MODELS)
      return result
    }
  } catch {
    // fall through to hardcoded fallback
  }

  // Curated fallback for popular brands
  const currentYear = new Date().getFullYear()
  const fallbackNames = FALLBACK_MODELS[make] ?? []
  const result = {
    models: fallbackNames.map((name) => ({ name, yearBegin: 2010, yearEnd: currentYear })),
  }
  if (result.models.length > 0) {
    await setCache(cacheKey, 'models', 'fallback', result, 1)
  }
  return result
}

export async function getYears(make, model) {
  if (!make || !model) return { years: [] }

  const modelsData = await getModels(make)
  const found = modelsData.models?.find(
    (m) => m.name.toLowerCase() === model.toLowerCase(),
  )

  const currentYear = new Date().getFullYear()

  if (!found || (found.yearBegin === 0 && found.yearEnd === 0)) {
    // Generate a generous fallback range (1995 → current year)
    const years = []
    for (let y = currentYear; y >= 1995; y--) years.push(y)
    return { years }
  }

  const start = found.yearBegin > 0 ? Math.max(found.yearBegin, 1990) : 1990
  const end = found.yearEnd > 0 && found.yearEnd <= currentYear + 1
    ? found.yearEnd
    : currentYear

  const years = []
  for (let y = end; y >= start; y--) years.push(y)
  return { years }
}

export async function enrichVehicle(make, model, year) {
  if (!make || !model || !year) return { suggestions: null }

  const cacheKey = `trims:${make.toLowerCase().replace(/\s+/g, '_')}:${model.toLowerCase().replace(/\s+/g, '_')}:${year}`
  const cached = await getCached(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchCarQuery({ cmd: 'getTrims', make, model, year })
    const trims = data.Trims ?? []
    if (!trims.length) return { suggestions: null }

    const bodyType = mostCommon(trims, (t) => t.model_body, normalizeBodyType)
    const fuelType = mostCommon(trims, (t) => t.model_engine_fuel, normalizeFuelType)
    const transmission = mostCommon(trims, (t) => t.model_transmission_type, normalizeTransmission)
    const drivetrain = mostCommon(trims, (t) => t.model_drive, normalizeDrivetrain)

    const first = trims[0]
    const cylinders = first?.model_engine_cyl ? Number(first.model_engine_cyl) : null
    const doors = first?.model_doors ? Number(first.model_doors) : null

    const suggestions = { bodyType, fuelType, transmission, drivetrain, cylinders, doors }
    const result = { suggestions }

    await setCache(cacheKey, 'trims', 'carquery', result, TTL_DAYS_TRIMS)
    return result
  } catch {
    return { suggestions: null }
  }
}

export async function decodeVin(vin) {
  if (!vin) return { vehicle: null }

  const normalized = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
  const cacheKey = `vin:${normalized}`
  const cached = await getCached(cacheKey)
  if (cached) return cached

  try {
    const url = `${NHTSA_BASE}/DecodeVin/${encodeURIComponent(normalized)}?format=json`
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error(`NHTSA HTTP ${res.status}`)

    const data = await res.json()
    const results = data.Results ?? []

    const get = (variable) => {
      const entry = results.find((r) => r.Variable === variable)
      const v = entry?.Value
      if (!v || v === 'Not Applicable' || v === '0' || v === 'null' || v === '') return null
      return v
    }

    const brandRaw = get('Make')
    const modelRaw = get('Model')
    const yearRaw = get('Model Year')

    const vehicle = {
      brand: brandRaw ? titleCase(brandRaw) : null,
      model: modelRaw ? titleCase(modelRaw) : null,
      year: yearRaw ? Number(yearRaw) : null,
      bodyType: normalizeBodyType(get('Body Class')),
      fuelType: normalizeFuelType(get('Fuel Type - Primary')),
      transmission: normalizeTransmission(get('Transmission Style')),
      drivetrain: normalizeDrivetrain(get('Drive Type')),
      cylinders: get('Engine Number of Cylinders') ? Number(get('Engine Number of Cylinders')) : null,
    }

    const result = { vehicle }
    await setCache(cacheKey, 'vin', 'nhtsa', result, TTL_DAYS_VIN)
    return result
  } catch {
    return { vehicle: null }
  }
}
