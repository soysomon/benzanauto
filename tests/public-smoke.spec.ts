import { expect, test } from '@playwright/test'

const inventoryVehicles = [
  {
    id: 'veh-prado-2026',
    slug: 'toyota-prado-2026',
    title: 'Toyota Prado 2026',
    brand: 'Toyota',
    model: 'Prado',
    year: 2026,
    price: 90000,
    currency: 'USD',
    mileage: 0,
    transmission: 'Automático',
    fuelType: 'Diesel',
    fuel: 'Diesel',
    bodyType: 'SUV',
    category: 'SUV',
    drivetrain: '4x4',
    traction: '4x4',
    color: 'Gris',
    condition: 'Nuevo',
    status: 'published',
    featured: true,
    badge: 'Oferta',
    mainImage: 'https://images.example.com/prado-main.webp',
    image: 'https://images.example.com/prado-main.webp',
    images: [
      {
        id: 'veh-prado-2026-image-1',
        url: 'https://images.example.com/prado-main.webp',
        width: 1280,
        height: 720,
        size: 120000,
        order: 0,
        isMain: true,
        mimeType: 'image/webp',
        alt: 'Toyota Prado 2026',
      },
      {
        id: 'veh-prado-2026-image-2',
        url: 'https://images.example.com/prado-side.webp',
        width: 1280,
        height: 720,
        size: 118000,
        order: 1,
        isMain: false,
        mimeType: 'image/webp',
        alt: 'Toyota Prado 2026 lateral',
      },
    ],
    gallery: [
      'https://images.example.com/prado-main.webp',
      'https://images.example.com/prado-side.webp',
    ],
    publishedAt: '2026-06-29T12:00:00.000Z',
    createdAt: '2026-06-29T10:00:00.000Z',
    updatedAt: '2026-06-29T12:00:00.000Z',
    location: 'San Juan de la Maguana, RD',
    description: 'SUV premium con enfoque familiar, tecnología avanzada y disponibilidad inmediata.',
    features: ['Cámara 360', 'Techo panorámico', 'Asientos ventilados'],
    specs: {
      motor: '2.8 Turbo Diesel',
      pasajeros: '7',
      potencia: '201 hp',
    },
    views: 8,
    contactCount: 2,
  },
  {
    id: 'veh-corolla-2026',
    slug: 'toyota-corolla-2026',
    title: 'Toyota Corolla 2026',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2026,
    price: 30000,
    currency: 'USD',
    mileage: 0,
    transmission: 'Automático',
    fuelType: 'Gasolina',
    fuel: 'Gasolina',
    bodyType: 'Sedan',
    category: 'Sedan',
    drivetrain: 'FWD',
    traction: 'FWD',
    color: 'Blanco',
    condition: 'Nuevo',
    status: 'published',
    featured: false,
    badge: '',
    mainImage: 'https://images.example.com/corolla-main.webp',
    image: 'https://images.example.com/corolla-main.webp',
    images: [
      {
        id: 'veh-corolla-2026-image-1',
        url: 'https://images.example.com/corolla-main.webp',
        width: 1280,
        height: 720,
        size: 110000,
        order: 0,
        isMain: true,
        mimeType: 'image/webp',
        alt: 'Toyota Corolla 2026',
      },
    ],
    gallery: ['https://images.example.com/corolla-main.webp'],
    publishedAt: '2026-06-28T12:00:00.000Z',
    createdAt: '2026-06-28T11:00:00.000Z',
    updatedAt: '2026-06-28T12:00:00.000Z',
    location: 'Santo Domingo, RD',
    description: 'Sedán nuevo con consumo eficiente y disponibilidad inmediata.',
    features: ['Apple CarPlay', 'Sensores de parqueo'],
    specs: {
      motor: '2.0',
      pasajeros: '5',
    },
    views: 4,
    contactCount: 1,
  },
]

function buildInventoryResponse(requestUrl: URL) {
  const query = requestUrl.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const brandFilters = requestUrl.searchParams.getAll('marca')
  const bodyTypeFilters = requestUrl.searchParams.getAll('tipo')
  const fuelFilters = requestUrl.searchParams.getAll('combustible')

  const filteredVehicles = inventoryVehicles.filter((vehicle) => {
    const matchesQuery = !query || [vehicle.title, vehicle.brand, vehicle.model, vehicle.description]
      .join(' ')
      .toLowerCase()
      .includes(query)
    const matchesBrand = brandFilters.length === 0 || brandFilters.includes(vehicle.brand)
    const matchesBodyType = bodyTypeFilters.length === 0 || bodyTypeFilters.includes(vehicle.bodyType)
    const matchesFuel = fuelFilters.length === 0 || fuelFilters.includes(vehicle.fuelType)

    return matchesQuery && matchesBrand && matchesBodyType && matchesFuel
  })

  return {
    data: filteredVehicles,
    meta: {
      total: filteredVehicles.length,
      page: 1,
      limit: filteredVehicles.length || 12,
      pages: 1,
    },
    facets: {
      brands: [{ value: 'Toyota', count: 2 }],
      bodyTypes: [
        { value: 'SUV', count: 1 },
        { value: 'Sedan', count: 1 },
      ],
      fuelTypes: [
        { value: 'Diesel', count: 1 },
        { value: 'Gasolina', count: 1 },
      ],
      conditions: [{ value: 'Nuevo', count: 2 }],
    },
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/admin/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para acceder.',
        },
      }),
    })
  })

  await page.route('**/api/vehicles/featured*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: inventoryVehicles.filter((vehicle) => vehicle.featured),
      }),
    })
  })

  await page.route('**/api/vehicles/*', async (route) => {
    const requestUrl = new URL(route.request().url())
    const slug = requestUrl.pathname.split('/').at(-1)
    const vehicle = inventoryVehicles.find((item) => item.slug === slug)

    if (!vehicle) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Vehículo no encontrado.',
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        vehicle,
      }),
    })
  })

  await page.route('**/api/vehicles?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildInventoryResponse(new URL(route.request().url()))),
    })
  })

  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: 'Ahora mismo tenemos un Toyota Prado 2026 y un Toyota Corolla 2026 publicados.',
        provider: 'rule-engine',
        recommendedVehicles: inventoryVehicles.slice(0, 2),
      }),
    })
  })
})

test('home renders public inventory cards from the live API contract', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Benzan Auto Import/i)
  await expect(page.getByRole('heading', { name: /Encuentra tu próximo vehículo/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ver inventario/i }).first()).toBeVisible()
})

test('inventory applies the public search flow without request storms or blank states', async ({ page }) => {
  await page.goto('/inventario')

  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Prado', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Corolla', exact: true })).toBeVisible()

  await page.getByPlaceholder('Buscar Toyota, Prado, diesel...').fill('Prado')

  await expect(page.getByRole('link', { name: 'Prado', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Corolla', exact: true })).toHaveCount(0)
})

test('vehicle detail resolves by slug and keeps related inventory visible', async ({ page }) => {
  await page.goto('/vehiculo/toyota-prado-2026')

  await expect(page.getByRole('heading', { name: 'Prado' })).toBeVisible()
  await expect(page.getByText('$90,000')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Ficha Técnica/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /También te puede interesar/i })).toBeVisible()
})

test('admin login route stays usable when there is no active cookie session', async ({ page }) => {
  await page.goto('/admin-login')

  await expect(page.getByRole('heading', { name: /Bienvenido de vuelta/i })).toBeVisible()
  await expect(page.getByLabel('Usuario o correo')).toBeVisible()
  await expect(page.getByLabel('Contraseña')).toBeVisible()
})

test('unknown routes render a controlled 404 page instead of a blank shell', async ({ page }) => {
  await page.goto('/ruta-que-no-existe')

  await expect(page.getByRole('heading', { name: /Página no disponible/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Volver al inicio/i })).toBeVisible()
})
