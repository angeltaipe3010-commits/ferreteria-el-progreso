import { animate, motion, useInView, type HTMLMotionProps } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Curva y resortes compartidos para que toda la app se mueva igual */
export const ease = [0.22, 1, 0.36, 1] as const
export const spring = { type: 'spring', stiffness: 380, damping: 32 } as const

/** Contenedor que escalona la entrada de sus hijos */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

export function Card({ className = '', children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={fadeUp} className={`card ${className}`} {...rest}>
      {children}
    </motion.div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: HTMLMotionProps<'button'> & { variant?: 'primary' | 'ghost' | 'soft' }) {
  const styles = {
    primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-500',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  }[variant]
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${styles} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

/** Número que cuenta hacia su valor cuando aparece en pantalla */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visible = useInView(ref, { once: true })
  const [shown, setShown] = useState(0)
  const desde = useRef(0)
  useEffect(() => {
    if (!visible) return
    const controls = animate(desde.current, value, {
      duration: 0.9,
      ease,
      onUpdate: (v) => setShown(v),
    })
    desde.current = value
    return () => controls.stop()
  }, [value, visible])
  return <span ref={ref}>{format(shown)}</span>
}

export function Badge({
  tone = 'slate',
  children,
}: {
  tone?: 'green' | 'red' | 'amber' | 'slate' | 'brand'
  children: ReactNode
}) {
  const t = {
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  )
}

/** Pestañas con indicador que se desliza entre opciones */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  id: string
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === o ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {value === o && (
            <motion.span
              layoutId={`seg-${id}`}
              transition={spring}
              className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-700"
            />
          )}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  )
}

export function Vacio({ texto }: { texto: string }) {
  return <div className="py-12 text-center text-sm text-slate-400">{texto}</div>
}
