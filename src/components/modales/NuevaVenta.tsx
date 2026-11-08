import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { clientes, productos, productoPorId, type MetodoPago } from '../../data/mock'
import { registrarVenta, useStore } from '../../data/store'
import { soles } from '../../lib/stats'
import Modal from '../Modal'
import { toast } from '../Toaster'
import { Button, Segmented } from '../ui'

const METODOS: MetodoPago[] = ['Efectivo', 'Yape/Plin', 'Tarjeta']

/** Punto de venta rápido: carrito, cliente y método de pago */
export default function NuevaVenta({ open, onClose }: { open: boolean; onClose: () => void }) {
  useStore()
  const [q, setQ] = useState('')
  const [carrito, setCarrito] = useState<Record<string, number>>({})
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo')
  const [clienteId, setClienteId] = useState('')
  const [recibido, setRecibido] = useState('')

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return productos.filter((p) => !t || p.nombre.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t))
  }, [q])

  const lineas = Object.entries(carrito).map(([id, cantidad]) => ({ p: productoPorId[id], cantidad }))
  const total = lineas.reduce((s, l) => s + l.p.precio * l.cantidad, 0)
  const vuelto = recibido === '' ? null : Number(recibido) - total

  const poner = (id: string, cantidad: number) =>
    setCarrito((c) => {
      const max = productoPorId[id].stock
      const n = Math.min(max, Math.max(0, cantidad))
      const copia = { ...c }
      if (n === 0) delete copia[id]
      else copia[id] = n
      return copia
    })

  const cerrar = () => {
    onClose()
    setTimeout(() => {
      setCarrito({})
      setQ('')
      setRecibido('')
      setClienteId('')
      setMetodo('Efectivo')
    }, 250)
  }

  const confirmar = () => {
    const v = registrarVenta({
      items: lineas.map((l) => ({ productoId: l.p.id, cantidad: l.cantidad })),
      metodo,
      clienteId: clienteId || null,
    })
    toast(`Venta ${v.id} registrada · ${soles(v.total)}`)
    cerrar()
  }

  return (
    <Modal open={open} onClose={cerrar} title="Nueva venta" ancho="sm:max-w-4xl">
      <div className="grid gap-5 md:grid-cols-5">
        {/* Catálogo */}
        <div className="md:col-span-3">
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800 dark:ring-slate-700">
            <Search className="size-4 text-slate-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto o categoría…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </label>
          <div className="mt-3 grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1 scroll-thin sm:grid-cols-3">
            {lista.map((p) => {
              const enCarrito = carrito[p.id] ?? 0
              const agotado = p.stock - enCarrito <= 0
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  disabled={agotado}
                  onClick={() => poner(p.id, enCarrito + 1)}
                  className={`relative rounded-2xl p-3 text-left ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    enCarrito ? 'bg-brand-50 ring-brand-300 dark:bg-brand-500/15 dark:ring-brand-500/40' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug">{p.nombre}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {soles(p.precio)} · {p.stock} {p.unidad}
                  </p>
                  <AnimatePresence>
                    {enCarrito > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white"
                      >
                        {enCarrito}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Carrito */}
        <div className="flex flex-col rounded-2xl bg-slate-50 p-4 md:col-span-2 dark:bg-slate-800/50">
          <p className="flex items-center gap-2 text-sm font-bold">
            <ShoppingCart className="size-4" /> Carrito
          </p>
          <ul className="mt-3 max-h-48 flex-1 space-y-2 overflow-y-auto scroll-thin">
            <AnimatePresence initial={false}>
              {lineas.map(({ p, cantidad }) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-2 rounded-xl bg-white p-2 text-sm dark:bg-slate-900"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.nombre}</span>
                    <span className="text-xs text-slate-400">{soles(p.precio * cantidad)}</span>
                  </span>
                  <button onClick={() => poner(p.id, cantidad - 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Quitar uno">
                    {cantidad === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                  </button>
                  <input
                    value={cantidad}
                    onChange={(e) => poner(p.id, parseInt(e.target.value, 10) || 0)}
                    inputMode="numeric"
                    className="w-10 rounded-lg bg-slate-100 py-1 text-center text-xs font-semibold outline-none dark:bg-slate-800"
                    aria-label="Cantidad"
                  />
                  <button onClick={() => poner(p.id, cantidad + 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Agregar uno">
                    <Plus className="size-3.5" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
            {!lineas.length && <li className="py-6 text-center text-xs text-slate-400">Toca un producto para agregarlo</li>}
          </ul>

          <div className="mt-4 space-y-3">
            <div>
              <span className="etiqueta">Cliente</span>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input">
                <option value="">Público general</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="etiqueta">Método de pago</span>
              <Segmented id="pos-metodo" options={METODOS} value={metodo} onChange={setMetodo} />
            </div>
            {metodo === 'Efectivo' && (
              <div>
                <span className="etiqueta">Recibido</span>
                <input value={recibido} onChange={(e) => setRecibido(e.target.value)} inputMode="decimal" type="number" placeholder="0.00" className="input" />
                {vuelto !== null && (
                  <p className={`mt-1 text-xs font-semibold ${vuelto < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {vuelto < 0 ? `Faltan ${soles(-vuelto)}` : `Vuelto: ${soles(vuelto)}`}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-end justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-2xl font-extrabold tabular-nums">{soles(total)}</span>
            </div>
            <Button className="w-full" disabled={!lineas.length || (vuelto !== null && vuelto < 0)} onClick={confirmar}>
              Cobrar {soles(total)}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
