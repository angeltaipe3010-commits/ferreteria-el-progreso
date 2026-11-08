import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Download, FileDown, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from '../components/Toaster'
import { abrir, useStore } from '../data/store'
import { descargarReporteDelDia } from '../lib/reporte'
import Modal from '../components/Modal'
import Page from '../components/Page'
import { Badge, Button, Card, CountUp, PageHeader, Segmented, Vacio, fadeUp } from '../components/ui'
import { HOY, clientePorId, productoPorId, vendedores, ventas, type MetodoPago, type Venta } from '../data/mock'
import { dias, fechaCorta, horaCorta, inicioMesActual, soles } from '../lib/stats'

const PERIODOS = ['Hoy', '7 días', 'Este mes'] as const
const METODOS: ('Todos' | MetodoPago)[] = ['Todos', 'Efectivo', 'Yape/Plin', 'Tarjeta']
const POR_PAGINA = 10

const tonoMetodo = { Efectivo: 'green', 'Yape/Plin': 'brand', Tarjeta: 'amber' } as const

function exportarCSV(lista: Venta[]) {
  const filas = [
    ['Comprobante', 'Fecha', 'Hora', 'Productos', 'Método', 'Vendedor', 'Cliente', 'Total'],
    ...lista.map((v) => [
      v.id,
      v.fecha.toLocaleDateString('es-PE'),
      horaCorta(v.fecha),
      v.items.map((i) => `${i.cantidad} x ${productoPorId[i.productoId].nombre}`).join(' | '),
      v.metodo,
      v.vendedor,
      v.clienteId ? clientePorId[v.clienteId].nombre : 'Público general',
      v.total.toFixed(2),
    ]),
  ]
  const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'ventas.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function Ventas() {
  const version = useStore()
  const [params] = useSearchParams()
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(params.get('q') ? 'Este mes' : '7 días')
  const [metodo, setMetodo] = useState<(typeof METODOS)[number]>('Todos')
  const [vendedor, setVendedor] = useState('Todos')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [pagina, setPagina] = useState(0)
  const [detalle, setDetalle] = useState<Venta | null>(null)

  const filtradas = useMemo(() => {
    const desde = periodo === 'Hoy' ? HOY : periodo === '7 días' ? dias(HOY, -6) : inicioMesActual()
    const texto = q.trim().toLowerCase()
    return ventas.filter(
      (v) =>
        v.fecha >= desde &&
        (metodo === 'Todos' || v.metodo === metodo) &&
        (vendedor === 'Todos' || v.vendedor === vendedor) &&
        (!texto ||
          v.id.toLowerCase().includes(texto) ||
          v.items.some((i) => productoPorId[i.productoId].nombre.toLowerCase().includes(texto)) ||
          (v.clienteId && clientePorId[v.clienteId].nombre.toLowerCase().includes(texto))),
    )
  }, [periodo, metodo, vendedor, q, version])

  const total = filtradas.reduce((s, v) => s + v.total, 0)
  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const pag = Math.min(pagina, paginas - 1)
  const visibles = filtradas.slice(pag * POR_PAGINA, pag * POR_PAGINA + POR_PAGINA)
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPagina(0)
  }

  return (
    <Page>
      <PageHeader
        title="Ventas"
        subtitle="Historial de comprobantes emitidos"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" onClick={() => exportarCSV(filtradas)}>
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="soft" onClick={() => descargarReporteDelDia().then(() => toast('Reporte del día generado'))}>
              <FileDown className="size-4" /> Reporte del día
            </Button>
            <Button onClick={() => abrir('venta')}>
              <Plus className="size-4" /> Nueva venta
            </Button>
          </div>
        }
      />

      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
        {[
          { t: 'Total vendido', v: total, f: (n: number) => soles(n) },
          { t: 'Comprobantes', v: filtradas.length, f: (n: number) => Math.round(n).toString() },
          { t: 'Ticket promedio', v: filtradas.length ? total / filtradas.length : 0, f: (n: number) => soles(n) },
        ].map((x) => (
          <div key={x.t} className="card p-4">
            <p className="text-xs font-medium text-slate-400">{x.t}</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums">
              <CountUp value={x.v} format={x.f} />
            </p>
          </div>
        ))}
      </motion.div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented id="periodo" options={PERIODOS} value={periodo} onChange={reset(setPeriodo)} />
          <select
            value={metodo}
            onChange={(e) => reset(setMetodo)(e.target.value as (typeof METODOS)[number])}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold outline-none dark:bg-slate-800"
          >
            {METODOS.map((m) => (
              <option key={m}>{m === 'Todos' ? 'Todos los métodos' : m}</option>
            ))}
          </select>
          <select
            value={vendedor}
            onChange={(e) => reset(setVendedor)(e.target.value)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold outline-none dark:bg-slate-800"
          >
            <option value="Todos">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <label className="ml-auto flex w-full items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 sm:w-64 dark:bg-slate-800">
            <Search className="size-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => reset(setQ)(e.target.value)}
              placeholder="Comprobante, producto, cliente…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-4 overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Comprobante</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Productos</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Método</th>
                <th className="pb-2 font-medium">Vendedor</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait" initial={false}>
              <motion.tbody
                key={`${periodo}-${metodo}-${vendedor}-${q}-${pag}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {visibles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setDetalle(v)}
                    className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{v.id}</td>
                    <td className="py-3 text-slate-500">
                      {fechaCorta(v.fecha)} · {horaCorta(v.fecha)}
                    </td>
                    <td className="max-w-[220px] truncate py-3">
                      {v.items.map((i) => productoPorId[i.productoId].nombre).join(', ')}
                    </td>
                    <td className="py-3 text-slate-500">{v.clienteId ? clientePorId[v.clienteId].nombre : 'Público general'}</td>
                    <td className="py-3">
                      <Badge tone={tonoMetodo[v.metodo]}>{v.metodo}</Badge>
                    </td>
                    <td className="py-3 text-slate-500">{v.vendedor}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{soles(v.total)}</td>
                  </tr>
                ))}
              </motion.tbody>
            </AnimatePresence>
          </table>
          {!filtradas.length && <Vacio texto="No hay ventas con esos filtros." />}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            {filtradas.length ? pag * POR_PAGINA + 1 : 0}–{Math.min((pag + 1) * POR_PAGINA, filtradas.length)} de {filtradas.length}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" className="!px-2" disabled={pag === 0} onClick={() => setPagina(pag - 1)} aria-label="Anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" className="!px-2" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)} aria-label="Siguiente">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={`Boleta ${detalle?.id ?? ''}`}>
        {detalle && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div>
                <p className="text-xs text-slate-400">Fecha</p>
                <p className="font-medium">
                  {detalle.fecha.toLocaleDateString('es-PE')} · {horaCorta(detalle.fecha)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Método</p>
                <p className="font-medium">{detalle.metodo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="font-medium">{detalle.clienteId ? clientePorId[detalle.clienteId].nombre : 'Público general'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Vendedor</p>
                <p className="font-medium">{detalle.vendedor}</p>
              </div>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {detalle.items.map((i) => {
                const p = productoPorId[i.productoId]
                return (
                  <li key={i.productoId} className="flex items-center gap-3 py-2.5">
                    <span className="text-lg">{p.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-slate-400">
                        {i.cantidad} {p.unidad} × {soles(p.precio)}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{soles(i.subtotal)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold dark:border-slate-700">
              <span>Total</span>
              <span className="tabular-nums">{soles(detalle.total)}</span>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
