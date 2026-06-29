import { describe, expect, it, vi } from 'vitest'
import {
  buildAbsoluteUrl,
  buildCanonicalUrl,
  buildPageTitle,
  getDefaultOgImage,
  normalizeAbsoluteUrl,
} from '../seo'
import { resolveRouteSeo } from '../seo.routes'

describe('seo helpers', () => {
  it('normalizes absolute site urls predictably', () => {
    expect(normalizeAbsoluteUrl('frontend.example.com')).toBe('https://frontend.example.com')
    expect(normalizeAbsoluteUrl('http://localhost:5173/')).toBe('http://localhost:5173')
    expect(normalizeAbsoluteUrl('')).toBe('')
  })

  it('builds absolute urls and canonical paths from VITE_SITE_URL', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://frontend.example.com')

    expect(buildAbsoluteUrl('/inventario')).toBe('https://frontend.example.com/inventario')
    expect(buildCanonicalUrl('/vehiculo/toyota-prado-2026')).toBe('https://frontend.example.com/vehiculo/toyota-prado-2026')
    expect(getDefaultOgImage()).toBe('https://frontend.example.com/images/banner-desktop.webp')
  })

  it('builds branded page titles', () => {
    expect(buildPageTitle('Inventario')).toBe('Inventario | Benzan Auto Import')
    expect(buildPageTitle('')).toBe('Benzan Auto Import')
  })

  it('marks admin-like routes as noindex and resolves public route defaults', () => {
    expect(resolveRouteSeo('/admin-login')).toMatchObject({ noIndex: true })
    expect(resolveRouteSeo('/inventario')?.title).toBe('Inventario de vehículos nuevos y usados')
  })
})
