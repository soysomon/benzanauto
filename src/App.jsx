import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CustomCursor from './components/ui/CustomCursor'
import ChatWidget from './components/ui/ChatWidget'
import Home from './pages/Home'
import Inventario from './pages/Inventario'
import VehiculoDetalle from './pages/VehiculoDetalle'
import Taller from './pages/Taller'
import BarGrill from './pages/BarGrill'
import BombaGasolina from './pages/BombaGasolina'
import Nosotros from './pages/Nosotros'
import Contacto from './pages/Contacto'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
}

const pageTransition = {
  type: 'tween',
  ease: [0.22, 1, 0.36, 1],
  duration: 0.4,
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/vehiculo/:id" element={<VehiculoDetalle />} />
          <Route path="/taller" element={<Taller />} />
          <Route path="/bar-grill" element={<BarGrill />} />
          <Route path="/bomba-gasolina" element={<BombaGasolina />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Router>
      <CustomCursor />
      <ScrollToTop />
      <Navbar />
      <main>
        <AnimatedRoutes />
      </main>
      <Footer />
      <ChatWidget />
    </Router>
  )
}
