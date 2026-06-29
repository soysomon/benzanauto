import Hero from '../components/home/Hero'
import TrustMarquee from '../components/home/TrustMarquee'
import FeaturedVehicles from '../components/home/FeaturedVehicles'
import ServicesCarousel from '../components/home/ServicesCarousel'
import StatsSection from '../components/home/StatsSection'
import ContactStrip from '../components/home/ContactStrip'
import SeoMeta from '../components/seo/SeoMeta'
import { buildOrganizationStructuredData, buildWebsiteStructuredData } from '../lib/seoStructuredData'

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
      <FeaturedVehicles />
      <ServicesCarousel />
      <StatsSection />
      <ContactStrip />
    </>
  )
}
