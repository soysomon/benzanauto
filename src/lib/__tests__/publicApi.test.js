import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sampleVehicleResponse = {
  data: [
    {
      id: 'veh_1',
      slug: 'toyota-prado-2026',
      title: 'Toyota Prado 2026',
      brand: 'Toyota',
      model: 'Prado',
      year: 2026,
      price: 90000,
      status: 'published',
      condition: 'Nuevo',
      images: [
        { url: 'https://cdn.example.com/prado.jpg' },
      ],
    },
  ],
  meta: { page: 1, limit: 60, total: 1, pages: 1 },
  facets: {
    brands: [{ value: 'Toyota', count: 1 }],
    bodyTypes: [{ value: 'SUV', count: 1 }],
    fuelTypes: [{ value: 'Diesel', count: 1 }],
    conditions: [{ value: 'Nuevo', count: 1 }],
  },
}

describe('publicApi caching', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-28T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
    vi.doUnmock('../apiClient')
  })

  it('reuses cached list responses for equivalent requests to avoid duplicate catalog calls', async () => {
    const apiRequest = vi.fn().mockResolvedValue(sampleVehicleResponse)
    vi.doMock('../apiClient', () => ({ apiRequest }))

    const { listPublicVehicles } = await import('../publicApi')

    const firstResponse = await listPublicVehicles({
      limit: 60,
      marca: ['Toyota'],
      estado: ['Nuevo'],
    })

    const secondResponse = await listPublicVehicles({
      estado: ['Nuevo'],
      marca: ['Toyota'],
      limit: 60,
    })

    expect(apiRequest).toHaveBeenCalledTimes(1)
    expect(firstResponse).toEqual(secondResponse)
    expect(firstResponse.data[0].slug).toBe('toyota-prado-2026')
  })

  it('falls back to the last successful catalog snapshot when a later request is rate limited', async () => {
    const apiRequest = vi
      .fn()
      .mockResolvedValueOnce(sampleVehicleResponse)
      .mockRejectedValueOnce({ status: 429, message: 'Too many requests' })

    vi.doMock('../apiClient', () => ({ apiRequest }))

    const { listPublicVehicles } = await import('../publicApi')
    const params = { limit: 60, marca: ['Toyota'] }

    const firstResponse = await listPublicVehicles(params, {
      cacheTtlMs: 1,
    })

    vi.advanceTimersByTime(5)
    vi.setSystemTime(new Date('2026-06-28T10:00:00.010Z'))

    const fallbackResponse = await listPublicVehicles(params, {
      cacheTtlMs: 1,
    })

    expect(apiRequest).toHaveBeenCalledTimes(2)
    expect(fallbackResponse).toEqual(firstResponse)
    expect(fallbackResponse.meta.total).toBe(1)
  })
})
