import { lazy, Suspense } from 'react'
import Hero from '../components/home/Hero'
import TrustMarquee from '../components/home/TrustMarquee'
import SeoMeta from '../components/seo/SeoMeta'
import DeferredSection from '../components/ui/DeferredSection'
import { SectionLoader } from '../components/ui/RouteLoader'
import { buildOrganizationStructuredData, buildWebsiteStructuredData } from '../lib/seoStructuredData'

const FeaturedVehicles = lazy(() => import('../components/home/FeaturedVehicles'))
const ServicesCarousel = lazy(() => import('../components/home/ServicesCarousel'))
const StatsSection = lazy(() => import('../components/home/StatsSection'))
const ContactStrip = lazy(() => import('../components/home/ContactStrip'))

export default function Home() {
  return (
    <>
      <SeoMeta
        title="Vehículos, taller y experiencia automotriz en República Dominicana"
        description="Descubre inventario actualizado, taller especializado, estación Texaco y atención personalizada en Benzan Auto Import."
        pathname="/"
        jsonLd={[
          buildOrganizationStructuredData(),
          buildWebsiteStructuredData(),
        ]}
      />
      <Hero />
      <TrustMarquee />
      <DeferredSection fallback={<SectionLoader heightClassName="min-h-[640px]" />}>
        <Suspense fallback={<SectionLoader heightClassName="min-h-[640px]" />}>
          <FeaturedVehicles />
        </Suspense>
      </DeferredSection>
      <DeferredSection fallback={<SectionLoader heightClassName="min-h-[420px]" />}>
        <Suspense fallback={<SectionLoader heightClassName="min-h-[420px]" />}>
          <ServicesCarousel />
        </Suspense>
      </DeferredSection>
      <DeferredSection fallback={<SectionLoader heightClassName="min-h-[320px]" />}>
        <Suspense fallback={<SectionLoader heightClassName="min-h-[320px]" />}>
          <StatsSection />
        </Suspense>
      </DeferredSection>
      <DeferredSection fallback={<SectionLoader heightClassName="min-h-[280px]" />}>
        <Suspense fallback={<SectionLoader heightClassName="min-h-[280px]" />}>
          <ContactStrip />
        </Suspense>
      </DeferredSection>
    </>
  )
}
