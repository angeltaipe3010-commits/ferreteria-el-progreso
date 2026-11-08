import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Phone, Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from '../components/Toaster'
import { abrir, cobrarDeuda, useStore } from '../data/store'
import Page from '../components/Page'
import { Badge, Button, Card, PageHeader, Segmented, fadeUp } from '../components/ui'
import { clientes, productoPorId, ventas } from '../data/mock'
import { fechaCorta, soles } from '../lib/stats'

const FILTROS = ['Todos', 'Con deuda'] as const

function CobrarDeuda({ id, deuda }: { id: string; deuda: number }) {
  const [monto, setMonto] = useState('')
  const n = Number(monto)
  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!(n > 0)) return
        cobrarDeuda(id, n)
        toast(`Pago registrado: ${soles(Math.min(n, deuda))}`)
        setMonto('')
      }}
    >
      <input
        type="number"
        min="0"
        step="0.1"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder={`Hasta ${soles(deuda)}`}
        className="input !py-2"
      />
      <Button type="submit" className="shrink-0 !py-2" disabled={!(n > 0)}>
        Registrar pago
      </Button>
      <Button type="button" variant="soft" className="shrink-0 !py-2" onClick={() => setMonto(String(deuda))}>
        Todo
      </Button>
    </form>
  )
}

export default function Clientes() {
  const version = useStore()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos')
  const [abierto, setAbierto] = useState<string | null>(null)

  const datos = useMemo(
    () =>
      clientes
        .map((c) => {
          const compras = ventas.filter((v) => v.clienteId === c.id)
          return { ...c, compras, total: compras.reduce((s, v) => s + v.total, 0), ultima: compras[0]?.fecha }
        })
        .sort((a, b) => b.total - a.total),
    [version],
  )
  const lista = datos.filter((c) => (filtro === 'Todos' || c.deuda > 0) && c.nombre.toLowerCase().includes(q.trim().toLowerCase()))
  const deudaTotal = clientes.reduce((s, c) => s + c.deuda, 0)

  return (
    <Page>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} clientes frecuentes · ${soles(deudaTotal, 0)} por cobrar`}
        action={
          <Button onClick={() => abrir('cliente')}>
            <UserPlus className="size-4" /> Nuevo cliente
          </Button>
        }
      />
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <Segmented id="clientes" options={FILTROS} value={filtro} onChange={setFiltro} />
        <label className="ml-auto flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 sm:w-64 dark:bg-slate-900 dark:ring-slate-800">
          <Search className="size-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </label>
      </motion.div>

      <Card className="divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        <AnimatePresence initial={false}>
          {lista.map((c) => {
            const open = abierto === c.id
            const iniciales = c.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('')
            return (
              <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                <button onClick={() => setAbierto(open ? null : c.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{iniciales}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {c.compras.length} compras · última {c.ultima ? fechaCorta(c.ultima) : '—'}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold tabular-nums">{soles(c.total, 0)}</p>
                    <p className="text-xs text-slate-400">comprado</p>
                  </div>
                  <div className="w-24 text-right">{c.deuda > 0 ? <Badge tone="red">Debe {soles(c.deuda, 0)}</Badge> : <Badge tone="green">Al día</Badge>}</div>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="size-4 text-slate-400" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 bg-slate-50 px-5 py-4 sm:grid-cols-3 dark:bg-slate-800/40">
                        <div className="text-sm">
                          <p className="text-xs text-slate-400">Teléfono</p>
                          <p className="mt-1 flex items-center gap-2 font-medium">
                            <Phone className="size-3.5 text-slate-400" /> {c.telefono}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-400">Últimas compras</p>
                          {!c.compras.length && <p className="mt-1 text-sm text-slate-400">Aún no tiene compras registradas.</p>}
                          <ul className="mt-1 space-y-1 text-sm">
                            {c.compras.slice(0, 3).map((v) => (
                              <li key={v.id} className="flex justify-between gap-3">
                                <span className="truncate">
                                  <span className="text-slate-400">{fechaCorta(v.fecha)}</span> · {v.items.map((i) => productoPorId[i.productoId].nombre).join(', ')}
                                </span>
                                <span className="font-semibold tabular-nums">{soles(v.total)}</span>
                              </li>
                            ))}
                          </ul>
                          {c.deuda > 0 && <CobrarDeuda id={c.id} deuda={c.deuda} />}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </Card>
    </Page>
  )
}
