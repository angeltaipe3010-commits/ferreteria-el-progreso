import { soles } from '../lib/stats'

interface Props {
  active?: boolean
  label?: string | number
  payload?: { value?: number | string; payload?: { tickets?: number } }[]
}

export default function ChartTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <p className="font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{soles(Number(p.value), 0)}</p>
      {p.payload?.tickets !== undefined && <p className="text-slate-400">{p.payload.tickets} tickets</p>}
    </div>
  )
}
