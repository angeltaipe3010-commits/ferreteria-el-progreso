import { motion } from 'framer-motion'
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Receipt, ShoppingCart, Trophy } from 'lucide-react'
import { lazy, Suspense, useMemo, useState, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from '../components/ChartTooltip'
import Page from '../components/Page'
import { Badge, Card, CountUp, Segmented, fadeUp, spring } from '../components/ui'
import { productos } from '../data/mock'
import { useStore } from '../data/store'
import { inicioMesActual, kpis, metodosPagoMes, nombreMes, serieDiaria, soles, sparkline, topProductos } from '../lib/stats'
import { useChartColors } from '../lib/useDark'

function Variacion({ v, sufijo }: { v: number; sufijo: string }) {
  const sube = v >= 0.05
  const baja = v <= -0.05
  return (
    <div className="flex flex-col items-start gap-1 whitespace-nowrap">
      <Badge tone={sube ? 'green' : baja ? 'red' : 'slate'}>
        {sube ? <ArrowUpRight className="size-3" /> : baja ? <ArrowDownRight className="size-3" /> : null}
        {sube ? '+' : ''}
        {v.toFixed(1)}%
      </Badge>
      <span className="text-xs text-slate-400">{sufijo}</span>
    </div>
  )
}

function Kpi({
  icon: Icon,
  titulo,
  children,
  pie,
  serie,
  to,
  alerta,
}: {
  icon: ElementType
  titulo: string
  children: React.ReactNode
  pie: React.ReactNode
  serie?: { v: number }[]
  to: string
  alerta?: boolean
}) {
  const navigate = useNavigate()
  const c = useChartColors()
  const color = alerta ? '#f59e0b' : c.principal
  const gid = `spark-${titulo.replace(/\s/g, '')}`
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      onClick={() => navigate(to)}
      className={`card group relative overflow-hidden p-5 text-left ${alerta ? 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            alerta ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-200'
          }`}
        >
          <Icon className="size-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{titulo}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">{children}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">{pie}</div>
        {serie && (
          <div className="pointer-events-none h-9 w-20 shrink-0 opacity-80 transition-opacity group-hover:opacity-100">
            <ResponsiveContainer>
              <AreaChart data={serie} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.button>
  )
}

const PatioCarga = lazy(() => import('../components/PatioCarga'))

const RANGOS = ['7 días', '30 días', '60 días'] as const

export default function Resumen() {
  const navigate = useNavigate()
  const v = useStore()
  const k = useMemo(kpis, [v])
  const c = useChartColors()
  const [rango, setRango] = useState<(typeof RANGOS)[number]>('30 días')
  const serie = useMemo(() => serieDiaria(parseInt(rango)), [rango, v])
  const promedio = serie.reduce((s, d) => s + d.ventas, 0) / serie.length
  const metodos = useMemo(metodosPagoMes, [v])
  const top = useMemo(() => topProductos(inicioMesActual()), [v])
  const bajos = productos.filter((p) => p.stock < p.minimo).sort((a, b) => a.stock / a.minimo - b.stock / b.minimo)

  return (
    <Page>
      {/* Escena 3D del patio de carga */}
      <motion.div variants={fadeUp} className="-mx-4 -mt-6 -mb-4 sm:-mx-6 lg:-mx-8">
        <Suspense fallback={<div className="h-80 sm:h-96" />}>
          <PatioCarga />
        </Suspense>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={ShoppingCart} titulo="Ventas de hoy" to="/ventas" serie={sparkline('ventas')} pie={<Variacion v={k.varHoy} sufijo="vs. sem. pasada" />}>
          <CountUp value={k.ventasHoy} format={(n) => soles(n)} />
        </Kpi>
        <Kpi icon={CalendarDays} titulo="Ventas del mes" to="/ventas" serie={sparkline('ventas', 30)} pie={<Variacion v={k.varMes} sufijo="vs. mes anterior" />}>
          <CountUp value={k.ventasMes} format={(n) => soles(n)} />
        </Kpi>
        <Kpi icon={Receipt} titulo="Ticket promedio" to="/ventas" serie={sparkline('ticket')} pie={<Variacion v={k.varTicket} sufijo={`${k.ticketsMes} ventas`} />}>
          <CountUp value={k.ticket} format={(n) => soles(n)} />
        </Kpi>
        <Kpi
          icon={AlertTriangle}
          titulo="Productos con stock bajo"
          to="/inventario?filtro=bajo"
          alerta
          pie={
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors group-hover:bg-amber-300/80 dark:bg-amber-500/25 dark:text-amber-200">
              Revisar ahora <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          }
        >
          <CountUp value={k.stockBajo} format={(n) => Math.round(n).toString()} />
        </Kpi>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Ventas diarias</h2>
              <p className="text-xs text-slate-400">
                Promedio: <span className="font-semibold text-slate-600 dark:text-slate-300">{soles(promedio, 0)}</span> por día · línea punteada
              </p>
            </div>
            <Segmented id="rango" options={RANGOS} value={rango} onChange={setRango} />
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={serie} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.principal} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={c.principal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} tick={{ fill: c.eje, fontSize: 11 }} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: c.eje, fontSize: 11 }}
                  tickFormatter={(v) => `S/ ${(v / 1000).toFixed(1)}k`}
                  width={60}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.eje, strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey={() => promedio}
                  stroke={c.eje}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  fill="none"
                  activeDot={false}
                  isAnimationActive={false}
                  tooltipType="none"
                />
                <Area
                  key={rango}
                  type="monotone"
                  dataKey="ventas"
                  stroke={c.principal}
                  strokeWidth={2.5}
                  fill="url(#gVentas)"
                  animationDuration={700}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: c.superficie }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold">Métodos de pago</h2>
          <p className="text-xs text-slate-400">{nombreMes()}</p>
          <div className="relative mx-auto mt-2 h-52 w-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={metodos}
                  dataKey="monto"
                  nameKey="metodo"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={2}
                  cornerRadius={6}
                  stroke={c.superficie}
                  strokeWidth={2}
                  animationDuration={900}
                >
                  {metodos.map((m, i) => (
                    <Cell key={m.metodo} fill={c.serie[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => soles(Number(v))}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${c.tooltip.border}`, background: c.tooltip.bg, color: c.tooltip.text, fontSize: 12 }}
                  itemStyle={{ color: c.tooltip.text }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-xs text-slate-400">Total del mes</p>
                <p className="text-lg font-extrabold tabular-nums">{soles(k.ventasMes, 0)}</p>
              </div>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {metodos.map((m, i) => (
              <li key={m.metodo} className="flex items-center gap-3 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: c.serie[i] }} />
                <span className="flex-1 font-medium">{m.metodo}</span>
                <span className="w-12 text-right text-slate-400 tabular-nums">{m.pct.toFixed(0)}%</span>
                <span className="w-24 text-right font-semibold tabular-nums">{soles(m.monto, 0)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Tablas */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <h2 className="font-bold">Top 5 productos</h2>
            <span className="ml-auto text-xs text-slate-400">por monto vendido · {nombreMes()}</span>
          </div>
          <div className="mt-4 overflow-x-auto scroll-thin">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 text-right font-medium">Cantidad</th>
                  <th className="pb-2 text-right font-medium">Monto</th>
                  <th className="w-28 pb-2" />
                </tr>
              </thead>
              <tbody>
                {top.map((t, i) => (
                  <motion.tr
                    key={t.producto.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-2.5 font-semibold text-slate-400">{i + 1}</td>
                    <td className="py-2.5 font-medium">
                      <span className="mr-2">{t.producto.emoji}</span>
                      {t.producto.nombre}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-slate-500">
                      {t.cantidad} {t.producto.unidad}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{soles(t.monto, 0)}</td>
                    <td className="py-2.5 pl-4">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <motion.div
                          className="h-full rounded-full bg-brand-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(t.monto / top[0].monto) * 100}%` }}
                          transition={{ delay: 0.35 + i * 0.05, duration: 0.7 }}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <h2 className="font-bold">Alertas de reposición</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/inventario?filtro=bajo')}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-700"
            >
              Ver inventario <ArrowRight className="size-3" />
            </motion.button>
          </div>
          <ul className="mt-4 space-y-2">
            {bajos.slice(0, 4).map((p) => (
              <motion.li
                key={p.id}
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.nombre}</p>
                  <p className="text-xs text-slate-400">
                    Quedan {p.stock} · mínimo {p.minimo}
                  </p>
                </div>
                <Badge tone={p.stock / p.minimo < 0.4 ? 'red' : 'amber'}>Stock: {p.stock}</Badge>
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  )
}
