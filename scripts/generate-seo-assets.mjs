import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { STATIC_PUBLIC_ROUTES } from '../src/lib/seo.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')

function normalizeAbsoluteUrl(rawValue) {
  if (typeof rawValue !== 'string') return ''

  const trimmed = rawValue.trim().replace(/\/$/, '')
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed

  if (process.env.RAILWAY_PUBLIC_DOMAIN && trimmed === process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${trimmed}`
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `http://${trimmed}`
  }

  return `https://${trimmed}`
}

function resolveSiteUrl() {
  const configured = normalizeAbsoluteUrl(process.env.VITE_SITE_URL)
  if (configured) return configured

  const railwayDomain = normalizeAbsoluteUrl(process.env.RAILWAY_PUBLIC_DOMAIN)
  if (railwayDomain) return railwayDomain

  console.warn('[SEO] VITE_SITE_URL no está definido. Usando fallback local para assets SEO.')
  return 'http://localhost:5173'
}

function resolveApiBaseUrl() {
  const configured = normalizeAbsoluteUrl(process.env.VITE_API_URL)
  if (!configured) return ''

  return configured.endsWith('/api') ? configured : `${configured}/api`
}

function buildAbsoluteUrl(siteUrl, pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return new URL(normalizedPath, `${siteUrl}/`).toString()
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchPublishedVehicleEntries(apiBaseUrl) {
  if (!apiBaseUrl) return []

  const collectedEntries = []
  let currentPage = 1
  let totalPages = 1
  const limit = 100
  const maxPages = 20

  while (currentPage <= totalPages && currentPage <= maxPages) {
    const requestUrl = new URL(`${apiBaseUrl}/vehicles`)
    requestUrl.searchParams.set('page', String(currentPage))
    requestUrl.searchParams.set('limit', String(limit))

    const response = await fetch(requestUrl, {
      headers: {
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`No se pudo consultar el inventario público para sitemap (${response.status}).`)
    }

    const payload = await response.json()
    const data = Array.isArray(payload?.data) ? payload.data : []

    for (const vehicle of data) {
      if (!vehicle?.slug) continue

      collectedEntries.push({
        path: `/vehiculo/${vehicle.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: vehicle.updatedAt || vehicle.publishedAt || new Date().toISOString(),
      })
    }

    totalPages = Math.max(1, Number(payload?.meta?.pages) || 1)
    currentPage += 1
  }

  return collectedEntries
}

function buildRobotsTxt(siteUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /admin-login',
    'Disallow: /dashboard',
    'Disallow: /login',
    `Sitemap: ${buildAbsoluteUrl(siteUrl, '/sitemap.xml')}`,
    '',
  ].join('\n')
}

function buildSitemapXml(siteUrl, entries) {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? new Date(entry.lastmod).toISOString() : new Date().toISOString()

      return [
        '  <url>',
        `    <loc>${escapeXml(buildAbsoluteUrl(siteUrl, entry.path))}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(entry.changefreq || 'weekly')}</changefreq>`,
        `    <priority>${escapeXml(entry.priority || '0.5')}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}

async function main() {
  const siteUrl = resolveSiteUrl()
  const apiBaseUrl = resolveApiBaseUrl()
  const staticEntries = STATIC_PUBLIC_ROUTES.map((route) => ({
    path: route.path,
    changefreq: route.changefreq,
    priority: route.priority,
    lastmod: new Date().toISOString(),
  }))

  let dynamicEntries = []

  if (apiBaseUrl) {
    try {
      dynamicEntries = await fetchPublishedVehicleEntries(apiBaseUrl)
      console.log(`[SEO] Sitemap dinámico generado con ${dynamicEntries.length} vehículos publicados.`)
    } catch (error) {
      console.warn(`[SEO] No se pudieron agregar vehículos al sitemap: ${error.message}`)
    }
  } else {
    console.warn('[SEO] VITE_API_URL no está definido. El sitemap se generará solo con rutas estáticas.')
  }

  const allEntries = [...staticEntries, ...dynamicEntries]
  const uniqueEntries = [...new Map(allEntries.map((entry) => [entry.path, entry])).values()]

  await mkdir(distDir, { recursive: true })
  await writeFile(path.join(distDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8')
  await writeFile(path.join(distDir, 'sitemap.xml'), buildSitemapXml(siteUrl, uniqueEntries), 'utf8')

  console.log(`[SEO] robots.txt y sitemap.xml generados en dist para ${siteUrl}.`)
}

main().catch((error) => {
  console.error('[SEO] Error generando assets SEO:', error)
  process.exitCode = 1
})
