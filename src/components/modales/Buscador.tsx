import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, FileDown, Moon, PackagePlus, Search, ShoppingCart, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientes, productos, ventas } from '../../data/mock'
import { abrir } from '../../data/store'
import { descargarReporteDelDia } from '../../lib/reporte'
import { soles } from '../../lib/stats'
import { NAV } from '../Layout'
import { toast } from '../Toaster'

type Item = { id: string; grupo: string; texto: string; detalle?: string; icono: ReactNode; accion: () => void }

/** Paleta de comandos (Ctrl + K): páginas, acciones, productos, clientes y boletas */
export default function Buscador({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const navigate = useNavigate()
  const lista = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const t = q.trim().toLowerCase()
    const ir = (ruta: string) => () => {
      onClose()
      navigate(ruta)
    }
    const acciones: Item[] = [
      { id: 'a-venta', grupo: 'Acciones', texto: 'Nueva venta', icono: <ShoppingCart className="size-4" />, accion: () => abrir('venta') },
      { id: 'a-prod', grupo: 'Acciones', texto: 'Nuevo producto', icono: <PackagePlus className="size-4" />, accion: () => abrir('producto') },
      { id: 'a-cli', grupo: 'Acciones', texto: 'Nuevo cliente', icono: <UserPlus className="size-4" />, accion: () => abrir('cliente') },
      {
        id: 'a-pdf',
        grupo: 'Acciones',
        texto: 'Descargar reporte del día (PDF)',
        icono: <FileDown className="size-4" />,
        accion: () => {
          onClose()
          descargarReporteDelDia().then(() => toast('Reporte del día generado'))
        },
      },
      {
        id: 'a-tema',
        grupo: 'Acciones',
        texto: 'Cambiar tema claro / oscuro',
        icono: <Moon className="size-4" />,
        accion: () => {
          onClose()
          document.dispatchEvent(new CustomEvent('cambiar-tema'))
        },
      },
    ]
    const paginas: Item[] = NAV.map((n) => ({ id: `p-${n.to}`, grupo: 'Páginas', texto: n.label, icono: <n.icon className="size-4" />, accion: ir(n.to) }))
    if (!t) return [...acciones, ...paginas]
    const coincide = (s: string) => s.toLowerCase().includes(t)
    const prods: Item[] = productos
      .filter((p) => coincide(p.nombre) || coincide(p.categoria))
      .slice(0, 5)
      .map((p) => ({ id: `pr-${p.id}`, grupo: 'Productos', texto: `${p.emoji} ${p.nombre}`, detalle: `${p.stock} ${p.unidad} · ${soles(p.precio)}`, icono: null, accion: ir(`/inventario?q=${encodeURIComponent(p.nombre)}`) }))
    const clis: Item[] = clientes
      .filter((c) => coincide(c.nombre))
      .slice(0, 4)
      .map((c) => ({ id: `cl-${c.id}`, grupo: 'Clientes', texto: c.nombre, detalle: c.deuda ? `Debe ${soles(c.deuda, 0)}` : 'Al día', icono: null, accion: ir(`/clientes?q=${encodeURIComponent(c.nombre)}`) }))
    const bols: Item[] = ventas
      .filter((v) => coincide(v.id))
      .slice(0, 4)
      .map((v) => ({ id: `b-${v.id}`, grupo: 'Boletas', texto: v.id, detalle: soles(v.total), icono: null, accion: ir(`/ventas?q=${v.id}`) }))
    return [...[...acciones, ...paginas].filter((i) => coincide(i.texto)), ...prods, ...clis, ...bols]
  }, [q, navigate, onClose])

  useEffect(() => setSel(0), [q])
  useEffect(() => {
    lista.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(items.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(0, s - 1))
    } else if (e.key === 'Enter') {
      items[sel]?.accion()
    }
  }

  let grupo = ''
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            <label className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <Search className="size-5 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={teclas}
                placeholder="Busca productos, clientes, boletas o acciones…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">ESC</kbd>
            </label>
            <ul ref={lista} className="max-h-[50vh] overflow-y-auto p-2 scroll-thin">
              {items.map((it, i) => {
                const cabecera = it.grupo !== grupo
                grupo = it.grupo
                return (
                  <li key={it.id}>
                    {cabecera && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{it.grupo}</p>}
                    <button
                      data-i={i}
                      onMouseEnter={() => setSel(i)}
                      onClick={it.accion}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${sel === i ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {sel === i && <motion.span layoutId="buscador-sel" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-slate-800" />}
                      {it.icono && <span className="relative text-slate-400">{it.icono}</span>}
                      <span className="relative flex-1 truncate font-medium">{it.texto}</span>
                      {it.detalle && <span className="relative text-xs text-slate-400">{it.detalle}</span>}
                      {sel === i && <CornerDownLeft className="relative size-3.5 text-slate-400" />}
                    </button>
                  </li>
                )
              })}
              {!items.length && (
                <li className="flex flex-col items-center gap-1 py-10 text-sm text-slate-400">
                  Sin resultados para “{q}”
                </li>
              )}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
