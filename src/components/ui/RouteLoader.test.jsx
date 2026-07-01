import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouteLoader, SectionLoader } from './RouteLoader'

describe('RouteLoader', () => {
  it('anuncia la carga de rutas públicas', () => {
    render(<RouteLoader />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/cargando contenido principal/i)).toBeInTheDocument()
  })

  it('anuncia la carga del panel administrativo', () => {
    render(<RouteLoader admin />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/cargando panel administrativo/i)).toBeInTheDocument()
  })

  it('anuncia la carga de secciones diferidas', () => {
    render(<SectionLoader />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/cargando sección/i)).toBeInTheDocument()
  })
})
