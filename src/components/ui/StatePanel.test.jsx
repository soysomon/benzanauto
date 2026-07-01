import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import StatePanel from './StatePanel'

describe('StatePanel', () => {
  it('expone un estado accesible por defecto', () => {
    render(<StatePanel title="Sin resultados" message="No encontramos vehículos." />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('permite anunciar errores y ejecutar su acción', () => {
    const onAction = vi.fn()

    render(
      <StatePanel
        title="Error"
        message="No se pudo cargar el inventario."
        actionLabel="Reintentar"
        onAction={onAction}
        role="alert"
        announcementMode="assertive"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
