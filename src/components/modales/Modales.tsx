import { useCallback, useEffect } from 'react'
import { abrir, useModal } from '../../data/store'
import Buscador from './Buscador'
import NuevaVenta from './NuevaVenta'
import NuevoCliente from './NuevoCliente'
import NuevoProducto from './NuevoProducto'

/** Modales que se pueden abrir desde cualquier pantalla (y atajo Ctrl + K) */
export default function Modales() {
  const modal = useModal()
  const cerrar = useCallback(() => abrir(null), [])

  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        abrir(modal === 'buscador' ? null : 'buscador')
      }
    }
    window.addEventListener('keydown', atajo)
    return () => window.removeEventListener('keydown', atajo)
  }, [modal])

  return (
    <>
      <Buscador open={modal === 'buscador'} onClose={cerrar} />
      <NuevaVenta open={modal === 'venta'} onClose={cerrar} />
      <NuevoProducto open={modal === 'producto'} onClose={cerrar} />
      <NuevoCliente open={modal === 'cliente'} onClose={cerrar} />
    </>
  )
}
