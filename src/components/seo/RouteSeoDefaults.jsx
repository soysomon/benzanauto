import { useLocation } from 'react-router-dom'
import SeoMeta from './SeoMeta'
import { resolveRouteSeo } from '../../lib/seo.routes'

export default function RouteSeoDefaults() {
  const { pathname } = useLocation()
  const routeSeo = resolveRouteSeo(pathname)

  if (!routeSeo) return null

  return (
    <SeoMeta
      title={routeSeo.title}
      description={routeSeo.description}
      pathname={pathname}
      noIndex={routeSeo.noIndex}
    />
  )
}
