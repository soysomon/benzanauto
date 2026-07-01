export const loadCustomCursor = () => import('../components/ui/CustomCursor')
export const loadChatWidget = () => import('../components/ui/ChatWidget')
export const loadHomePage = () => import('../pages/Home')
export const loadInventarioPage = () => import('../pages/Inventario')
export const loadVehiculoDetallePage = () => import('../pages/VehiculoDetalle')
export const loadTallerPage = () => import('../pages/Taller')
export const loadBarGrillPage = () => import('../pages/BarGrill')
export const loadBombaGasolinaPage = () => import('../pages/BombaGasolina')
export const loadNosotrosPage = () => import('../pages/Nosotros')
export const loadContactoPage = () => import('../pages/Contacto')
export const loadNotFoundPage = () => import('../pages/NotFoundPage')
export const loadAdminLoginPage = () => import('../pages/AdminLoginPage')
export const loadAdminDashboardPage = () => import('../pages/AdminDashboardPage')
export const loadAdminForgotPasswordPage = () => import('../pages/AdminForgotPasswordPage')
export const loadAdminResetPasswordPage = () => import('../pages/AdminResetPasswordPage')
export const loadAdminUsersPage = () => import('../pages/AdminUsersPage')
export const loadAdminAuditPage = () => import('../pages/AdminAuditPage')
export const loadAdminSecurityPage = () => import('../pages/AdminSecurityPage')

const routeModuleLoaders = new Map([
  ['/', loadHomePage],
  ['/inventario', loadInventarioPage],
  ['/vehiculo', loadVehiculoDetallePage],
  ['/taller', loadTallerPage],
  ['/bar-grill', loadBarGrillPage],
  ['/bomba-gasolina', loadBombaGasolinaPage],
  ['/nosotros', loadNosotrosPage],
  ['/contacto', loadContactoPage],
  ['/404', loadNotFoundPage],
  ['/admin-login', loadAdminLoginPage],
  ['/admin/forgot-password', loadAdminForgotPasswordPage],
  ['/admin/reset-password', loadAdminResetPasswordPage],
  ['/admin', loadAdminDashboardPage],
  ['/admin/users', loadAdminUsersPage],
  ['/admin/audit', loadAdminAuditPage],
  ['/admin/security', loadAdminSecurityPage],
])

const modulePrefetchCache = new Map()

function normalizeRoutePath(pathname = '/') {
  if (!pathname || pathname === '/') return '/'
  if (pathname === '/login') return '/admin-login'
  if (pathname === '/dashboard') return '/admin'
  if (pathname.startsWith('/vehiculo/')) return '/vehiculo'
  if (pathname.startsWith('/admin/reset-password')) return '/admin/reset-password'
  if (pathname.startsWith('/admin/forgot-password')) return '/admin/forgot-password'
  if (pathname.startsWith('/admin/users')) return '/admin/users'
  if (pathname.startsWith('/admin/audit')) return '/admin/audit'
  if (pathname.startsWith('/admin/security')) return '/admin/security'
  if (pathname.startsWith('/admin-login')) return '/admin-login'
  if (pathname.startsWith('/admin')) return '/admin'
  return pathname
}

export function preloadRouteModule(pathname) {
  const normalizedPath = normalizeRoutePath(pathname)
  const loader = routeModuleLoaders.get(normalizedPath)
  if (!loader) return Promise.resolve(null)

  if (modulePrefetchCache.has(normalizedPath)) {
    return modulePrefetchCache.get(normalizedPath)
  }

  const preloadPromise = loader().catch((error) => {
    modulePrefetchCache.delete(normalizedPath)
    throw error
  })

  modulePrefetchCache.set(normalizedPath, preloadPromise)
  return preloadPromise
}

export function prefetchRoute(pathname) {
  const normalizedPath = normalizeRoutePath(pathname)
  const tasks = [preloadRouteModule(normalizedPath)]

  if (normalizedPath === '/') {
    tasks.push(
      import('./publicApi')
        .then(({ getFeaturedVehicles }) => getFeaturedVehicles())
        .catch(() => null),
    )
  }

  if (normalizedPath === '/inventario') {
    tasks.push(
      import('./publicApi')
        .then(({ listPublicVehicles }) => listPublicVehicles({ limit: 60 }))
        .catch(() => null),
    )
  }

  return Promise.allSettled(tasks)
}

export function prefetchVehicleDetailRoute(identifier) {
  if (!identifier) return Promise.resolve([])

  return Promise.allSettled([
    preloadRouteModule('/vehiculo'),
    import('./publicApi')
      .then(({ getVehicleDetail }) => getVehicleDetail(identifier))
      .catch(() => null),
  ])
}
