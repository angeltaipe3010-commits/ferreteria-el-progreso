import { useState } from 'react'
import { agregarCliente } from '../../data/store'
import Modal from '../Modal'
import { toast } from '../Toaster'
import { Button } from '../ui'

export default function NuevoCliente({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const valido = nombre.trim().length >= 3

  return (
    <Modal open={open} onClose={onClose} title="Nuevo cliente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valido) return
          const c = agregarCliente({ nombre: nombre.trim(), telefono: telefono.trim() || '—' })
          toast(`Cliente "${c.nombre}" agregado`)
          onClose()
          setNombre('')
          setTelefono('')
        }}
      >
        <label className="block">
          <span className="etiqueta">Nombre o razón social</span>
          <input autoFocus className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Constructora Los Andes S.A.C." />
        </label>
        <label className="block">
          <span className="etiqueta">Teléfono</span>
          <input className="input" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="9XX XXX XXX" />
        </label>
        <Button type="submit" className="w-full" disabled={!valido}>
          Guardar cliente
        </Button>
      </form>
    </Modal>
  )
}
