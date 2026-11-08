import { useState } from 'react'
import { productos } from '../../data/mock'
import { agregarProducto } from '../../data/store'
import Modal from '../Modal'
import { toast } from '../Toaster'
import { Button } from '../ui'

const EMOJIS = ['🔧', '🔩', '🔨', '🪛', '🧱', '🎨', '⚡', '💡', '🔌', '📏', '🧪', '🪚', '🧰', '🪣', '🚿', '📦']
const UNIDADES = ['und.', 'kg', 'm', 'gal', 'L', 'bls.', 'cj.']
const categorias = () => Array.from(new Set(productos.map((p) => p.categoria)))

export default function NuevoProducto({ open, onClose }: { open: boolean; onClose: () => void }) {
  const vacio = { nombre: '', categoria: 'Herramientas', precio: '', stock: '', minimo: '5', unidad: 'und.', emoji: '🔧' }
  const [f, setF] = useState(vacio)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const valido = f.nombre.trim() && Number(f.precio) > 0 && f.stock !== ''

  const guardar = () => {
    const p = agregarProducto({
      nombre: f.nombre.trim(),
      categoria: f.categoria.trim() || 'General',
      precio: Number(f.precio),
      stock: Math.max(0, Math.floor(Number(f.stock))),
      minimo: Math.max(0, Math.floor(Number(f.minimo) || 0)),
      unidad: f.unidad,
      emoji: f.emoji,
    })
    toast(`Producto "${p.nombre}" agregado`)
    onClose()
    setF(vacio)
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo producto">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (valido) guardar()
        }}
      >
        <div>
          <span className="etiqueta">Ícono</span>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setF((x) => ({ ...x, emoji: em }))}
                className={`grid size-9 place-items-center rounded-xl text-lg transition-colors ${f.emoji === em ? 'bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800'}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="etiqueta">Nombre</span>
          <input autoFocus className="input" value={f.nombre} onChange={set('nombre')} placeholder="Ej. Llave francesa 10&quot;" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="etiqueta">Categoría</span>
            <input className="input" list="cats" value={f.categoria} onChange={set('categoria')} />
            <datalist id="cats">
              {categorias().map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="etiqueta">Unidad</span>
            <select className="input" value={f.unidad} onChange={set('unidad')}>
              {UNIDADES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="etiqueta">Precio (S/)</span>
            <input className="input" type="number" step="0.1" min="0" value={f.precio} onChange={set('precio')} placeholder="0.00" />
          </label>
          <label className="block">
            <span className="etiqueta">Stock inicial</span>
            <input className="input" type="number" min="0" value={f.stock} onChange={set('stock')} placeholder="0" />
          </label>
          <label className="block">
            <span className="etiqueta">Stock mínimo</span>
            <input className="input" type="number" min="0" value={f.minimo} onChange={set('minimo')} />
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={!valido}>
          Guardar producto
        </Button>
      </form>
    </Modal>
  )
}
