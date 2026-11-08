import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import Page from '../components/Page'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import Modal from '../components/Modal'
import { toast } from '../components/Toaster'
import { NEGOCIO } from '../data/mock'
import { guardarNegocio, reiniciarDemo } from '../data/store'

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? 'justify-end bg-brand-600' : 'justify-start bg-slate-300 dark:bg-slate-700'}`}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} className="size-5 rounded-full bg-white shadow" />
    </button>
  )
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="etiqueta">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  )
}

const usuarios = [
  { nombre: 'Angel', correo: 'angel@elprogreso.pe', rol: 'Administrador' },
  { nombre: 'Rosa', correo: 'rosa@elprogreso.pe', rol: 'Cajera' },
  { nombre: 'Jhon', correo: 'jhon@elprogreso.pe', rol: 'Vendedor' },
]

export default function Configuracion() {
  const [opts, setOpts] = useState({ alertas: true, resumen: true, fiado: false, boleta: true })
  const [guardado, setGuardado] = useState(false)
  const [negocio, setNegocio] = useState({ ...NEGOCIO })
  const [confirmar, setConfirmar] = useState(false)
  const set = (k: keyof typeof opts) => (v: boolean) => setOpts((o) => ({ ...o, [k]: v }))
  const campo = (k: keyof typeof negocio) => (v: string) => setNegocio((n) => ({ ...n, [k]: v }))

  return (
    <Page>
      <PageHeader
        title="Configuración"
        subtitle="Datos del negocio, preferencias y usuarios"
        action={
          <Button
            onClick={() => {
              guardarNegocio(negocio)
              setGuardado(true)
              toast('Cambios guardados')
              setTimeout(() => setGuardado(false), 1800)
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={guardado ? 'ok' : 'save'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="inline-flex items-center gap-2">
                {guardado ? <Check className="size-4" /> : <Save className="size-4" />}
                {guardado ? 'Guardado' : 'Guardar cambios'}
              </motion.span>
            </AnimatePresence>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="font-bold">Datos del negocio</h2>
          <Campo label="Nombre comercial" value={negocio.nombre} onChange={campo('nombre')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="RUC" value={negocio.ruc} onChange={campo('ruc')} />
            <Campo label="Teléfono" value={negocio.telefono} onChange={campo('telefono')} />
          </div>
          <Campo label="Dirección" value={negocio.direccion} onChange={campo('direccion')} />
        </Card>

        <Card className="p-5">
          <h2 className="font-bold">Preferencias</h2>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {(
              [
                ['alertas', 'Alertas de stock bajo', 'Avisar cuando un producto baje de su mínimo'],
                ['resumen', 'Resumen diario por WhatsApp', 'Ventas y cuadre de caja al cerrar el día'],
                ['fiado', 'Permitir ventas al crédito', 'Registrar deudas de clientes frecuentes'],
                ['boleta', 'Imprimir boleta automáticamente', 'Al confirmar cada venta'],
              ] as const
            ).map(([k, t, d]) => (
              <li key={k} className="flex items-center gap-4 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-xs text-slate-400">{d}</p>
                </div>
                <Switch on={opts[k]} onChange={set(k)} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <h2 className="font-bold">Usuarios</h2>
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {usuarios.map((u) => (
              <li key={u.correo} className="flex items-center gap-4 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">{u.nombre[0]}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{u.nombre}</p>
                  <p className="text-xs text-slate-400">{u.correo}</p>
                </div>
                <Badge tone={u.rol === 'Administrador' ? 'brand' : 'slate'}>{u.rol}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-wrap items-center gap-4 p-5 xl:col-span-2">
          <div className="flex-1">
            <h2 className="font-bold">Datos de la demo</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Las ventas, productos y clientes que agregues se guardan en este navegador durante el día. Puedes volver a los datos de ejemplo cuando quieras.</p>
          </div>
          <Button variant="soft" onClick={() => setConfirmar(true)}>
            <RotateCcw className="size-4" /> Restablecer demo
          </Button>
        </Card>
      </div>

      <Modal open={confirmar} onClose={() => setConfirmar(false)} title="¿Restablecer la demo?">
        <p className="text-sm text-slate-500 dark:text-slate-400">Se borrarán las ventas, productos, clientes y movimientos de caja que registraste hoy y se cargarán de nuevo los datos de ejemplo.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmar(false)}>
            Cancelar
          </Button>
          <Button onClick={reiniciarDemo}>Sí, restablecer</Button>
        </div>
      </Modal>
    </Page>
  )
}
