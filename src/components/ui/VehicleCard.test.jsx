import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import VehicleCard from './VehicleCard'

const trackVehicleContactMock = vi.fn()

function stripMotionProps(props = {}) {
  const {
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileInView,
    viewport,
    layoutId,
    ...domProps
  } = props

  return domProps
}

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
  motion: {
    article: ({ children, ...props }) => <article {...stripMotionProps(props)}>{children}</article>,
  },
}))

vi.mock('./Badge', () => ({
  default: ({ children }) => <span>{children}</span>,
}))

vi.mock('../../lib/publicApi', () => ({
  trackVehicleContact: (...args) => trackVehicleContactMock(...args),
}))

vi.mock('../../lib/routeModules', () => ({
  prefetchVehicleDetailRoute: vi.fn(),
}))

describe('VehicleCard', () => {
  it('expone una navegacion completa de la card y protege el CTA interno de WhatsApp', () => {
    trackVehicleContactMock.mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <VehicleCard
          vehicle={{
            id: 'veh_1',
            slug: 'toyota-prado-2026',
            brand: 'Toyota',
            model: 'Prado',
            year: 2026,
            image: 'https://cdn.example.com/prado.jpg',
            category: 'SUV',
            badge: 'Oferta',
            condition: 'Nuevo',
            transmission: 'Automatica',
            fuel: 'Diesel',
            traction: '4x4',
            mileage: 0,
            price: 90000,
          }}
        />
      </MemoryRouter>,
    )

    const detailLink = screen.getByRole('link', { name: /ver detalle de toyota prado 2026/i })
    const whatsappLink = screen.getByRole('link', { name: /consultar toyota prado 2026 por whatsapp/i })

    expect(detailLink).toHaveAttribute('href', '/vehiculo/toyota-prado-2026')
    expect(screen.getAllByRole('link')).toHaveLength(2)

    fireEvent.click(whatsappLink)

    expect(trackVehicleContactMock).toHaveBeenCalledWith('toyota-prado-2026')
  })
})
