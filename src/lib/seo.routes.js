export const STATIC_PUBLIC_ROUTES = [
  {
    path: '/',
    title: 'Vehículos, taller y experiencia automotriz en República Dominicana',
    description: 'Benzan Auto Import reúne inventario real, taller especializado, estación Texaco y atención personalizada desde San Juan de la Maguana.',
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    path: '/inventario',
    title: 'Inventario de vehículos nuevos y usados',
    description: 'Explora el inventario actualizado de Benzan Auto Import con filtros por marca, modelo, combustible, categoría y precio.',
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    path: '/taller',
    title: 'Taller automotriz y servicio especializado',
    description: 'Agenda mantenimiento Toyota, servicios express, multiservicio y soluciones automotrices con atención profesional en Benzan Auto Import.',
    changefreq: 'weekly',
    priority: '0.8',
  },
  {
    path: '/bar-grill',
    title: 'Bar & Grill Benzan',
    description: 'Reserva tu experiencia en el Bar & Grill Benzan con ambiente premium, atención directa y confirmación rápida por WhatsApp.',
    changefreq: 'weekly',
    priority: '0.7',
  },
  {
    path: '/bomba-gasolina',
    title: 'Texaco Benzan y estación de combustible',
    description: 'Conoce Texaco Benzan, sus horarios, precios referenciales y ubicación para cargar combustible con servicio confiable en San Juan.',
    changefreq: 'weekly',
    priority: '0.7',
  },
  {
    path: '/nosotros',
    title: 'Nosotros',
    description: 'Descubre la historia, visión, misión y valores que sostienen la experiencia de Benzan Auto Import en el sur de República Dominicana.',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/contacto',
    title: 'Contacto',
    description: 'Habla con Benzan Auto Import para solicitar información, cotizaciones, citas de taller o asistencia personalizada.',
    changefreq: 'monthly',
    priority: '0.7',
  },
]

const ADMIN_ROUTE_DEFAULTS = {
  title: 'Acceso administrativo',
  description: 'Ruta administrativa interna de Benzan Auto Import.',
  noIndex: true,
}

export function isAdminLikeRoute(pathname = '') {
  return pathname === '/login'
    || pathname === '/dashboard'
    || pathname.startsWith('/admin')
}

export function getStaticRouteSeo(pathname = '') {
  return STATIC_PUBLIC_ROUTES.find((route) => route.path === pathname) ?? null
}

export function resolveRouteSeo(pathname = '') {
  if (isAdminLikeRoute(pathname)) return ADMIN_ROUTE_DEFAULTS
  return getStaticRouteSeo(pathname)
}
