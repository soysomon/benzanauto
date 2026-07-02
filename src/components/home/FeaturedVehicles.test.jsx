import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import FeaturedVehicles from './FeaturedVehicles'

const getFeaturedVehiclesMock = vi.fn()
const listPublicVehiclesMock = vi.fn()

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
  motion: {
    article: ({ children, ...props }) => <article {...stripMotionProps(props)}>{children}</article>,
    span: ({ children, ...props }) => <span {...stripMotionProps(props)}>{children}</span>,
  },
}))

vi.mock('../../lib/publicApi', () => ({
  getFeaturedVehicles: (...args) => getFeaturedVehiclesMock(...args),
  listPublicVehicles: (...args) => listPublicVehiclesMock(...args),
}))

vi.mock('../ui/StatePanel', () => ({
  default: ({ title, message }) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  ),
}))

vi.mock('../../lib/routeModules', () => ({
  prefetchRoute: vi.fn(),
  prefetchVehicleDetailRoute: vi.fn(),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderSection() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <LocationProbe />
              <FeaturedVehicles />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FeaturedVehicles', () => {
  it('mantiene el CTA Ver todo operativo y hace navegables todas las cards destacadas', async () => {
    getFeaturedVehiclesMock.mockResolvedValue([
      {
        id: 'veh_1',
        slug: 'toyota-prado-2026',
        brand: 'Toyota',
        model: 'Prado',
        year: 2026,
        category: 'SUV',
        price: 90000,
        image: 'https://cdn.example.com/prado.jpg',
        badge: 'Oferta',
      },
      {
        id: 'veh_2',
        slug: 'honda-crv-2025',
        brand: 'Honda',
        model: 'CR-V',
        year: 2025,
        category: 'SUV',
        price: 54000,
        image: 'https://cdn.example.com/crv.jpg',
      },
      {
        id: 'veh_3',
        slug: 'toyota-corolla-2026',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2026,
        category: 'Sedan',
        price: 30000,
        image: 'https://cdn.example.com/corolla.jpg',
      },
      {
        id: 'veh_4',
        slug: 'ford-ranger-2024',
        brand: 'Ford',
        model: 'Ranger',
        year: 2024,
        category: 'Pickup',
        price: 47000,
        image: 'https://cdn.example.com/ranger.jpg',
      },
    ])

    renderSection()

    const inventoryLink = await screen.findByRole('link', { name: /ver todo/i })
    expect(inventoryLink).toHaveAttribute('href', '/inventario')

    const detailLinks = await screen.findAllByRole('link', { name: /ver detalle de/i })
    const uniqueVehicleRoutes = new Set(detailLinks.map((link) => link.getAttribute('href')))
    expect(uniqueVehicleRoutes).toEqual(new Set([
      '/vehiculo/toyota-prado-2026',
      '/vehiculo/honda-crv-2025',
      '/vehiculo/toyota-corolla-2026',
      '/vehiculo/ford-ranger-2024',
    ]))

    fireEvent.click(inventoryLink)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/inventario')
    })
  })
})
