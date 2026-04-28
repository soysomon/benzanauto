import Hero from '../components/home/Hero'
import TrustMarquee from '../components/home/TrustMarquee'
import FeaturedVehicles from '../components/home/FeaturedVehicles'
import ServicesCarousel from '../components/home/ServicesCarousel'
import StatsSection from '../components/home/StatsSection'
import ContactStrip from '../components/home/ContactStrip'

export default function Home() {
  return (
    <>
      <Hero />
      <TrustMarquee />
      <FeaturedVehicles />
      <ServicesCarousel />
      <StatsSection />
      <ContactStrip />
    </>
  )
}
