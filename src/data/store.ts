/**
 * Estado de la demo. Los arreglos de mock.ts se modifican en el lugar y cada
 * cambio avisa a los componentes suscritos (useStore). Lo que crea el usuario
 * se guarda en localStorage durante el día; al día siguiente la demo se renueva.
 */
import { useSyncExternalStore } from 'react'
import {
  HOY,
  NEGOCIO,
  clientePorId,
  clientes,
  movimientosCaja,
  productoPorId,
  productos,
  ventas,
  type Cliente,
  type ItemVenta,
  type MetodoPago,
  type MovimientoCaja,
  type Producto,
  type Venta,
} from './mock'

const CLAVE = 'ferreteria-demo-v1'

let version = 0
const oyentes = new Set<() => void>()
const avisar = () => {
  version++
  oyentes.forEach((f) => f())
  guardar()
}

export function useStore() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => version,
  )
}

// ---- estado extra (lo creado por el usuario) ----
const extra = {
  ventas: [] as Venta[],
  movimientos: [] as MovimientoCaja[],
  cajaCerrada: false,
}
export const caja = {
  get cerrada() {
    return extra.cajaCerrada
  },
}

// ---- persistencia ----
function guardar() {
  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify({
        dia: HOY.toISOString(),
        negocio: NEGOCIO,
        productos,
        clientes,
        ventas: extra.ventas,
        movimientos: extra.movimientos,
        cajaCerrada: extra.cajaCerrada,
      }),
    )
  } catch {
    /* sin almacenamiento: la demo funciona igual, solo no recuerda */
  }
}

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return
    const d = JSON.parse(raw)
    if (d.dia !== HOY.toISOString()) return localStorage.removeItem(CLAVE)
    Object.assign(NEGOCIO, d.negocio)
    productos.splice(0, productos.length, ...d.productos)
    clientes.splice(0, clientes.length, ...d.clientes)
    reindexar()
    extra.ventas = (d.ventas as Venta[]).map((v) => ({ ...v, fecha: new Date(v.fecha) }))
    extra.movimientos = (d.movimientos as MovimientoCaja[]).map((m) => ({ ...m, hora: new Date(m.hora) }))
    extra.cajaCerrada = !!d.cajaCerrada
    ventas.unshift(...extra.ventas)
    movimientosCaja.push(...extra.movimientos)
    movimientosCaja.sort((a, b) => a.hora.getTime() - b.hora.getTime())
  } catch {
    /* datos corruptos: se ignoran */
  }
}

function reindexar() {
  for (const k of Object.keys(productoPorId)) delete productoPorId[k]
  for (const k of Object.keys(clientePorId)) delete clientePorId[k]
  productos.forEach((p) => (productoPorId[p.id] = p))
  clientes.forEach((c) => (clientePorId[c.id] = c))
}

cargar()

// ---- acciones ----
const siguienteId = (lista: { id: string }[]) => {
  // toma el último grupo de dígitos: B001-001923 → 1923, P16 → 16
  const n = lista.reduce((m, x) => Math.max(m, parseInt(x.id.match(/(\d+)$/)?.[1] ?? '0', 10)), 0)
  return n + 1
}

function moverCaja(concepto: string, tipo: 'ingreso' | 'egreso', monto: number) {
  const m: MovimientoCaja = { id: `U${Date.now()}${Math.random().toString(36).slice(2, 5)}`, hora: new Date(), concepto, tipo, monto }
  movimientosCaja.push(m)
  extra.movimientos.push(m)
}

export function registrarVenta(datos: { items: { productoId: string; cantidad: number }[]; metodo: MetodoPago; clienteId: string | null }) {
  const items: ItemVenta[] = datos.items.map((i) => ({
    productoId: i.productoId,
    cantidad: i.cantidad,
    subtotal: Math.round(i.cantidad * productoPorId[i.productoId].precio * 100) / 100,
  }))
  const total = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100
  const venta: Venta = {
    id: `B001-${String(siguienteId(ventas)).padStart(6, '0')}`,
    fecha: new Date(),
    items,
    total,
    metodo: datos.metodo,
    vendedor: 'Angel',
    clienteId: datos.clienteId,
  }
  items.forEach((i) => (productoPorId[i.productoId].stock = Math.max(0, productoPorId[i.productoId].stock - i.cantidad)))
  ventas.unshift(venta)
  extra.ventas.unshift(venta)
  if (datos.metodo === 'Efectivo') moverCaja(`Venta ${venta.id}`, 'ingreso', total)
  avisar()
  return venta
}

export function agregarProducto(p: Omit<Producto, 'id'>) {
  const nuevo: Producto = { ...p, id: `P${String(siguienteId(productos)).padStart(2, '0')}` }
  productos.push(nuevo)
  productoPorId[nuevo.id] = nuevo
  avisar()
  return nuevo
}

export function ajustarStock(id: string, cantidad: number) {
  const p = productoPorId[id]
  if (!p) return
  p.stock = Math.max(0, p.stock + cantidad)
  avisar()
}

export function agregarCliente(c: Omit<Cliente, 'id' | 'deuda'>) {
  const nuevo: Cliente = { ...c, id: `C${String(siguienteId(clientes)).padStart(2, '0')}`, deuda: 0 }
  clientes.push(nuevo)
  clientePorId[nuevo.id] = nuevo
  avisar()
  return nuevo
}

export function cobrarDeuda(id: string, monto: number) {
  const c = clientePorId[id]
  if (!c) return
  const cobro = Math.min(monto, c.deuda)
  c.deuda = Math.round((c.deuda - cobro) * 100) / 100
  moverCaja(`Cobro de deuda · ${c.nombre}`, 'ingreso', cobro)
  avisar()
}

export function registrarEgreso(concepto: string, monto: number) {
  moverCaja(concepto, 'egreso', monto)
  avisar()
}

export function cerrarCaja() {
  extra.cajaCerrada = true
  avisar()
}

export function guardarNegocio(datos: Partial<typeof NEGOCIO>) {
  Object.assign(NEGOCIO, datos)
  avisar()
}

export function reiniciarDemo() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada */
  }
  window.location.reload()
}

// ---- sesión (solo demo) ----
const CLAVE_SESION = 'ferreteria-sesion'
let sesion: string | null = (() => {
  try {
    return localStorage.getItem(CLAVE_SESION)
  } catch {
    return null
  }
})()
const oyentesSesion = new Set<() => void>()
export function useSesion() {
  return useSyncExternalStore(
    (f) => {
      oyentesSesion.add(f)
      return () => oyentesSesion.delete(f)
    },
    () => sesion,
  )
}
export function iniciarSesion(usuario: string) {
  sesion = usuario
  try {
    localStorage.setItem(CLAVE_SESION, usuario)
  } catch {
    /* nada */
  }
  oyentesSesion.forEach((f) => f())
}
export function cerrarSesion() {
  sesion = null
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    /* nada */
  }
  oyentesSesion.forEach((f) => f())
}

// ---- modales globales (se abren desde cualquier página o desde Ctrl+K) ----
export type ModalGlobal = 'venta' | 'producto' | 'cliente' | 'buscador' | null
let modal: ModalGlobal = null
const oyentesModal = new Set<() => void>()
export function useModal() {
  return useSyncExternalStore(
    (f) => {
      oyentesModal.add(f)
      return () => oyentesModal.delete(f)
    },
    () => modal,
  )
}
export function abrir(m: ModalGlobal) {
  modal = m
  oyentesModal.forEach((f) => f())
}
