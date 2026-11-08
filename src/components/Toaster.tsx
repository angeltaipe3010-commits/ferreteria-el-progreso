import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useSyncExternalStore } from 'react'

type Toast = { id: number; texto: string; tipo: 'ok' | 'info' | 'error' }
let lista: Toast[] = []
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((f) => f())

/** Muestra una notificación breve en la esquina inferior */
export function toast(texto: string, tipo: Toast['tipo'] = 'ok') {
  const t = { id: Date.now() + Math.random(), texto, tipo }
  lista = [...lista, t].slice(-3)
  avisar()
  setTimeout(() => {
    lista = lista.filter((x) => x.id !== t.id)
    avisar()
  }, 3200)
}

const iconos = {
  ok: <CheckCircle2 className="size-5 text-emerald-500" />,
  info: <Info className="size-5 text-brand-500" />,
  error: <XCircle className="size-5 text-rose-500" />,
}

export default function Toaster() {
  const items = useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => lista,
  )
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            {iconos[t.tipo]}
            {t.texto}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
