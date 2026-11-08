import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ease } from '../components/ui'
import { NEGOCIO } from '../data/mock'
import { iniciarSesion } from '../data/store'

const DEMO = { correo: 'demo@elprogreso.pe', clave: 'demo1234' }

export default function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const entrar = (usuario: string) => {
    setCargando(true)
    setTimeout(() => {
      iniciarSesion(usuario)
      navigate('/', { replace: true })
    }, 550)
  }

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-navy-800 p-12 text-white lg:flex lg:flex-col lg:justify-between dark:from-slate-900 dark:via-slate-950 dark:to-black">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11 12 4l9 7" />
              <path d="M5 10v9h14v-9" />
              <path d="m10 18 4-4m-1-1 2 2" />
            </svg>
          </div>
          <span className="text-lg font-extrabold">{NEGOCIO.nombre}</span>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Tu negocio bajo control, desde cualquier lugar.</h2>
          <p className="mt-4 text-white/70">Ventas, inventario, caja y clientes en un solo panel. Revisa cómo va tu día desde la computadora o el celular.</p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            {['Alertas de stock bajo antes de quedarte sin mercadería', 'Cuadre de caja en segundos', 'Reporte del día en PDF'].map((t, i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-white/15 text-xs">✓</span>
                {t}
              </motion.li>
            ))}
          </ul>
        </motion.div>
        <p className="relative text-xs text-white/50">Proyecto de demostración · los datos son ficticios</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold tracking-tight">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ingresa al panel de control de tu ferretería.</p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => entrar('Angel')}
            disabled={cargando}
            className="mt-8 flex w-full items-center gap-3 rounded-2xl bg-brand-50 p-4 text-left ring-1 ring-brand-200 transition-colors hover:bg-brand-100 dark:bg-brand-500/10 dark:ring-brand-500/30 dark:hover:bg-brand-500/20"
          >
            <PlayCircle className="size-8 shrink-0 text-brand-600 dark:text-brand-400" />
            <span>
              <span className="block text-sm font-bold text-brand-700 dark:text-brand-200">Entrar como demo</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Sin registro · explora con datos de ejemplo</span>
            </span>
          </motion.button>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />o con tu cuenta<span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (correo.trim().toLowerCase() === DEMO.correo && clave === DEMO.clave) entrar('Angel')
              else setError('Correo o contraseña incorrectos. Usa los datos de la demo.')
            }}
          >
            <label className="block">
              <span className="etiqueta">Correo</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input type="email" autoComplete="username" className="input !pl-9" value={correo} onChange={(e) => (setCorreo(e.target.value), setError(''))} placeholder="tu@correo.com" />
              </span>
            </label>
            <label className="block">
              <span className="etiqueta">Contraseña</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input type={ver ? 'text' : 'password'} autoComplete="current-password" className="input !pl-9 !pr-10" value={clave} onChange={(e) => (setClave(e.target.value), setError(''))} placeholder="••••••••" />
                <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-rose-500">
                {error}
              </motion.p>
            )}
            <Button type="submit" className="w-full !py-2.5" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </Button>
            <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Datos de la demo: <span className="font-mono font-semibold">{DEMO.correo}</span> / <span className="font-mono font-semibold">{DEMO.clave}</span>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
