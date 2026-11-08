import { AnimatePresence, motion } from 'framer-motion'
import { Minus, PackagePlus, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import Page from '../components/Page'
import { toast } from '../components/Toaster'
import { Badge, Button, PageHeader, Vacio, fadeUp, spring } from '../components/ui'
import { productos, type Producto } from '../data/mock'
import { abrir, ajustarStock, useStore } from '../data/store'
import { soles } from '../lib/stats'


function estado(stock: number, minimo: number) {
  const r = stock / minimo
  if (r < 0.4) return { tone: 'red' as const, texto: 'Crítico', barra: 'bg-rose-500' }
  if (r < 1) return { tone: 'amber' as const, texto: 'Bajo', barra: 'bg-amber-500' }
  return { tone: 'green' as const, texto: 'Normal', barra: 'bg-emerald-500' }
}

function AjustarStock({ producto, onClose }: { producto: Producto | null; onClose: () => void }) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const n = Math.floor(Number(cantidad))
  const p = producto
  const resultado = p ? Math.max(0, p.stock + (tipo === 'entrada' ? n || 0 : -(n || 0))) : 0
  const cerrar = () => {
    onClose()
    setTimeout(() => (setCantidad(''), setTipo('entrada')), 250)
  }
  return (
    <Modal open={!!p} onClose={cerrar} title="Ajustar stock">
      {p && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!(n > 0)) return
            ajustarStock(p.id, tipo === 'entrada' ? n : -n)
            toast(`${p.nombre}: ${tipo === 'entrada' ? '+' : '−'}${n} ${p.unidad}`)
            cerrar()
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="text-2xl">{p.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">{p.nombre}</p>
              <p className="text-xs text-slate-400">
                Stock actual: {p.stock} {p.unidad} · mínimo {p.minimo}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['entrada', 'salida'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTipo(t)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 transition-colors ${
                  tipo === t
                    ? t === 'entrada'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/40'
                      : 'bg-rose-50 text-rose-600 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40'
                    : 'ring-slate-200 text-slate-500 dark:ring-slate-700'
                }`}
              >
                {t === 'entrada' ? <Plus className="size-4" /> : <Minus className="size-4" />}
                {t === 'entrada' ? 'Entrada de mercadería' : 'Salida / merma'}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="etiqueta">Cantidad ({p.unidad})</span>
            <input autoFocus type="number" min="1" className="input" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" />
          </label>
          <p className="text-sm text-slate-500">
            Quedará en <span className="font-bold text-slate-800 dark:text-slate-100">{resultado} {p.unidad}</span>
          </p>
          <Button type="submit" className="w-full" disabled={!(n > 0)}>
            Guardar ajuste
          </Button>
        </form>
      )}
    </Modal>
  )
}

export default function Inventario() {
  const version = useStore()
  const [params, setParams] = useSearchParams()
  const soloBajo = params.get('filtro') === 'bajo'
  const [categoria, setCategoria] = useState('Todas')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [editar, setEditar] = useState<Producto | null>(null)
  const categorias = ['Todas', ...Array.from(new Set(productos.map((p) => p.categoria)))]

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return productos
      .filter((p) => (!soloBajo || p.stock < p.minimo) && (categoria === 'Todas' || p.categoria === categoria) && (!t || p.nombre.toLowerCase().includes(t)))
      .sort((a, b) => a.stock / a.minimo - b.stock / b.minimo)
  }, [soloBajo, categoria, q, version])

  const valorizado = productos.reduce((s, p) => s + p.stock * p.precio, 0)
  const bajos = productos.filter((p) => p.stock < p.minimo).length

  return (
    <Page>
      <PageHeader
        title="Inventario"
        subtitle={`${productos.length} productos · valorizado en ${soles(valorizado, 0)}`}
        action={
          <Button onClick={() => abrir('producto')}>
            <PackagePlus className="size-4" /> Nuevo producto
          </Button>
        }
      />

      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setParams(soloBajo ? {} : { filtro: 'bajo' })}
          className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            soloBajo ? 'text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
          }`}
        >
          {soloBajo && <motion.span layoutId="chip-bajo" transition={spring} className="absolute inset-0 rounded-full bg-amber-500" />}
          <span className="relative">⚠ Solo stock bajo ({bajos})</span>
        </button>
        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`relative rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              categoria === c ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {categoria === c && <motion.span layoutId="chip-cat" transition={spring} className="absolute inset-0 rounded-full bg-navy-800 dark:bg-brand-600" />}
            <span className="relative">{c}</span>
          </button>
        ))}
        <label className="ml-auto flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 sm:w-60 dark:bg-slate-900 dark:ring-slate-800">
          <Search className="size-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </label>
      </motion.div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {lista.map((p) => {
            const e = estado(p.stock, p.minimo)
            const pct = Math.min(100, (p.stock / (p.minimo * 2)) * 100)
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setEditar(p)}
                className="card cursor-pointer p-4"
                title="Ajustar stock"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{p.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {p.categoria} · {soles(p.precio)} / {p.unidad}
                    </p>
                  </div>
                  <Badge tone={e.tone}>{e.texto}</Badge>
                </div>
                <div className="mt-4 flex items-end justify-between text-sm">
                  <span>
                    <span className="text-xl font-extrabold tabular-nums">{p.stock}</span>{' '}
                    <span className="text-slate-400">{p.unidad}</span>
                  </span>
                  <span className="text-xs text-slate-400">mínimo {p.minimo}</span>
                </div>
                <div className="relative mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div className={`h-full rounded-full ${e.barra}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: 0.1 }} />
                  {/* marca del mínimo */}
                  <span className="absolute -top-0.5 left-1/2 h-3 w-0.5 rounded bg-slate-400/70" />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
      {!lista.length && <Vacio texto="No hay productos con esos filtros." />}
      <AjustarStock producto={editar} onClose={() => setEditar(null)} />
    </Page>
  )
}
