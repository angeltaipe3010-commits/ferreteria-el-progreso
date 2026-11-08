import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Lock, MinusCircle, Wallet } from 'lucide-react'
import { useState } from 'react'
import Modal from '../components/Modal'
import Page from '../components/Page'
import { toast } from '../components/Toaster'
import { caja, cerrarCaja, registrarEgreso, useStore } from '../data/store'
import { Badge, Button, Card, CountUp, PageHeader, fadeUp } from '../components/ui'
import { HOY, movimientosCaja, ventas } from '../data/mock'
import { horaCorta, soles } from '../lib/stats'

function Egreso({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const valido = concepto.trim().length > 2 && Number(monto) > 0
  return (
    <Modal open={open} onClose={onClose} title="Registrar egreso">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valido) return
          registrarEgreso(concepto.trim(), Number(monto))
          toast(`Egreso registrado: ${soles(Number(monto))}`)
          setConcepto('')
          setMonto('')
          onClose()
        }}
      >
        <label className="block">
          <span className="etiqueta">Concepto</span>
          <input autoFocus className="input" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. Pago de luz, compra de bolsas…" />
        </label>
        <label className="block">
          <span className="etiqueta">Monto (S/)</span>
          <input className="input" type="number" min="0" step="0.1" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </label>
        <Button type="submit" className="w-full" disabled={!valido}>
          Guardar egreso
        </Button>
      </form>
    </Modal>
  )
}

export default function Caja() {
  useStore()
  const [egreso, setEgreso] = useState(false)
  const apertura = movimientosCaja.find((m) => m.concepto === 'Apertura de caja')?.monto ?? 0
  const ingresos = movimientosCaja.filter((m) => m.tipo === 'ingreso' && m.concepto !== 'Apertura de caja').reduce((s, m) => s + m.monto, 0)
  const egresos = movimientosCaja.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const esperado = apertura + ingresos - egresos
  const digitales = ventas.filter((v) => v.fecha >= HOY && v.metodo !== 'Efectivo').reduce((s, v) => s + v.total, 0)

  const [cierre, setCierre] = useState(false)
  const [contado, setContado] = useState('')
  const cerrada = caja.cerrada
  const diferencia = contado === '' ? null : Number(contado) - esperado

  const tarjetas = [
    { t: 'Apertura', v: apertura, icon: Wallet, tone: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
    { t: 'Ingresos en efectivo', v: ingresos, icon: ArrowDownLeft, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15' },
    { t: 'Egresos', v: egresos, icon: ArrowUpRight, tone: 'text-rose-500 bg-rose-50 dark:bg-rose-500/15' },
    { t: 'Efectivo esperado', v: esperado, icon: Lock, tone: 'text-brand-600 bg-brand-50 dark:bg-brand-500/15' },
  ]

  return (
    <Page>
      <PageHeader
        title="Caja del día"
        subtitle={HOY.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        action={
          cerrada ? (
            <Badge tone="slate">Caja cerrada</Badge>
          ) : (
            <div className="flex gap-2">
              <Button variant="soft" onClick={() => setEgreso(true)}>
                <MinusCircle className="size-4" /> Registrar egreso
              </Button>
              <Button onClick={() => setCierre(true)}>
                <Lock className="size-4" /> Cerrar caja
              </Button>
            </div>
          )
        }
      />

      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(({ t, v, icon: Icon, tone }) => (
          <div key={t} className="card flex items-center gap-4 p-5">
            <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">{t}</p>
              <p className="text-xl font-extrabold tabular-nums">
                <CountUp value={v} format={(n) => soles(n)} />
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-bold">Movimientos</h2>
          <p className="text-xs text-slate-400">Solo efectivo · {movimientosCaja.length} movimientos</p>
          <ol className="relative mt-5 max-h-[480px] space-y-1 overflow-y-auto pr-2 scroll-thin">
            {movimientosCaja
              .slice()
              .reverse()
              .map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + Math.min(i, 12) * 0.03 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className={`grid size-8 place-items-center rounded-full ${m.tipo === 'ingreso' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/15'}`}>
                    {m.tipo === 'ingreso' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <span className="flex-1 text-sm font-medium">{m.concepto}</span>
                  <span className="text-xs text-slate-400">{horaCorta(m.hora)}</span>
                  <span className={`w-24 text-right text-sm font-semibold tabular-nums ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {m.tipo === 'ingreso' ? '+' : '−'}
                    {soles(m.monto)}
                  </span>
                </motion.li>
              ))}
          </ol>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold">Cobros digitales de hoy</h2>
          <p className="text-xs text-slate-400">No pasan por la caja física</p>
          <p className="mt-4 text-3xl font-extrabold tabular-nums">
            <CountUp value={digitales} format={(n) => soles(n)} />
          </p>
          <p className="mt-1 text-sm text-slate-500">Yape/Plin y tarjeta</p>
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-navy-800 p-5 text-white">
            <p className="text-sm text-white/70">Total del día (todos los métodos)</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{soles(ingresos + digitales)}</p>
          </div>
        </Card>
      </div>

      <Modal open={cierre} onClose={() => setCierre(false)} title="Cierre de caja">
        <div className="space-y-4 text-sm">
          <div className="flex justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <span className="text-slate-500">Efectivo esperado</span>
            <span className="font-bold tabular-nums">{soles(esperado)}</span>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Efectivo contado en caja</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand-500 dark:ring-slate-700">
              <span className="text-slate-400">S/</span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={contado}
                onChange={(e) => setContado(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-base font-semibold outline-none"
              />
            </div>
          </label>
          {diferencia !== null && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 font-semibold ${
                Math.abs(diferencia) < 0.01
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : diferencia > 0
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
              }`}
            >
              {Math.abs(diferencia) < 0.01 ? '✓ La caja cuadra exacto' : diferencia > 0 ? `Sobrante de ${soles(diferencia)}` : `Faltante de ${soles(-diferencia)}`}
            </motion.div>
          )}
          <Button
            className="w-full"
            disabled={contado === ''}
            onClick={() => {
              cerrarCaja()
              setCierre(false)
              toast(diferencia !== null && Math.abs(diferencia) >= 0.01 ? `Caja cerrada con ${diferencia > 0 ? 'sobrante' : 'faltante'} de ${soles(Math.abs(diferencia))}` : 'Caja cerrada: cuadra exacto')
            }}
          >
            Confirmar cierre
          </Button>
        </div>
      </Modal>
      <Egreso open={egreso} onClose={() => setEgreso(false)} />
    </Page>
  )
}
