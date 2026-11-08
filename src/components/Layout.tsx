import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Boxes,
  CalendarDays,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { NEGOCIO, productos } from '../data/mock'
import { abrir, cerrarSesion, useSesion, useStore } from '../data/store'
import Modales from './modales/Modales'
import Toaster from './Toaster'
import { nombreMes } from '../lib/stats'
import { Button, ease, spring } from './ui'

export const NAV = [
  { to: '/', label: 'Resumen', icon: LayoutGrid },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/caja', label: 'Caja', icon: Wallet },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-navy-800 text-white shadow-lg shadow-brand-600/30">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11 12 4l9 7" />
          <path d="M5 10v9h14v-9" />
          <path d="m10 18 4-4m-1-1 2 2" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ferretería</p>
        <p className="font-extrabold text-navy-800 dark:text-white">El Progreso</p>
      </div>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  return (
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <NavLink key={to} to={to} onClick={onNavigate} className="relative">
            {active && (
              <motion.span
                layoutId="nav-pill"
                transition={spring}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-md shadow-brand-600/30"
              />
            )}
            <motion.span
              whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                active ? 'text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={2.2} />
              {label}
            </motion.span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function UserBox() {
  const usuario = useSesion() ?? 'Angel'
  const navigate = useNavigate()
  return (
    <div className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-sm font-bold text-white">{usuario[0]?.toUpperCase()}</div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{usuario}</p>
        <p className="text-xs text-slate-400">Administrador</p>
      </div>
      <button
        onClick={() => {
          cerrarSesion()
          navigate('/login')
        }}
        title="Cerrar sesión"
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        aria-label="Cerrar sesión"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}

function Notificaciones() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useStore()
  const bajos = productos.filter((p) => p.stock < p.minimo)
  useEffect(() => {
    const cerrar = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])
  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-xl bg-white ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800"
        aria-label="Notificaciones"
      >
        <Bell className="size-[18px]" />
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
          {bajos.length}
        </span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease }}
            className="card absolute right-0 z-30 mt-2 w-72 origin-top-right p-2"
          >
            <p className="px-2 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Stock bajo</p>
            {!bajos.length && <p className="px-2 py-3 text-sm text-slate-400">Todo el inventario está sobre su mínimo ✓</p>}
            {bajos.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setOpen(false)
                  navigate('/inventario?filtro=bajo')
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{p.nombre}</span>
                <span className="text-xs font-semibold text-rose-500">{p.stock}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function useTema() {
  const [oscuro, setOscuro] = useState(() => {
    try {
      return localStorage.getItem('tema') === 'oscuro'
    } catch {
      return false
    }
  })
  useEffect(() => {
    const alternar = () => setOscuro((o) => !o)
    document.addEventListener('cambiar-tema', alternar)
    return () => document.removeEventListener('cambiar-tema', alternar)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
    try {
      localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro')
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [oscuro])
  return [oscuro, setOscuro] as const
}

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default function Layout({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [oscuro, setOscuro] = useTema()
  const { pathname } = useLocation()
  const usuario = useSesion() ?? 'Angel'
  useStore()

  useEffect(() => setDrawer(false), [pathname])

  return (
    <div className="flex min-h-full">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <Logo />
        <NavItems />
        <UserBox />
      </aside>

      {/* Drawer móvil */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white px-4 py-6 shadow-2xl lg:hidden dark:bg-slate-900"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setDrawer(false)} className="rounded-lg p-2 text-slate-400" aria-label="Cerrar menú">
                  <X className="size-5" />
                </button>
              </div>
              <NavItems onNavigate={() => setDrawer(false)} />
              <UserBox />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950/80">
          <button onClick={() => setDrawer(true)} className="rounded-xl p-2 text-slate-600 lg:hidden dark:text-slate-300" aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold sm:text-xl">
              {saludo()}, <span className="text-brand-600 dark:text-brand-400">{usuario}</span>
            </p>
            <p className="hidden text-xs text-slate-400 sm:block">{NEGOCIO.direccion}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium ring-1 ring-slate-200 md:flex dark:bg-slate-900 dark:ring-slate-800">
              <CalendarDays className="size-4 text-slate-400" />
              {nombreMes()}
            </div>
            <button
              onClick={() => abrir('buscador')}
              className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 xl:flex dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800"
            >
              <Search className="size-4" />
              <span className="w-32 whitespace-nowrap text-left">Buscar…</span>
              <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">Ctrl K</kbd>
            </button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => abrir('buscador')}
              className="grid size-10 place-items-center rounded-xl bg-white ring-1 ring-slate-200 transition-colors hover:bg-slate-50 xl:hidden dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800"
              aria-label="Buscar"
            >
              <Search className="size-[18px]" />
            </motion.button>
            <Button onClick={() => abrir('venta')} className="!px-3 sm:!px-4" aria-label="Nueva venta">
              <Plus className="size-4" strokeWidth={2.6} />
              <span className="hidden sm:inline">Nueva venta</span>
            </Button>
            <motion.button
              whileTap={{ scale: 0.92, rotate: -15 }}
              onClick={() => setOscuro((o) => !o)}
              className="grid size-10 place-items-center rounded-xl bg-white ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800"
              aria-label="Cambiar tema"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={oscuro ? 'sol' : 'luna'}
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  {oscuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <Notificaciones />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <Modales />
      <Toaster />
    </div>
  )
}
