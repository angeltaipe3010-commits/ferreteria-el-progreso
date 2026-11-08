// Datos de demostración generados de forma determinista (siempre los mismos)
// y relativos a la fecha actual, para que todas las cifras cuadren entre sí.

export type MetodoPago = 'Efectivo' | 'Yape/Plin' | 'Tarjeta'

export interface Producto {
  id: string
  nombre: string
  categoria: string
  precio: number
  stock: number
  minimo: number
  unidad: string
  emoji: string
}

export interface ItemVenta {
  productoId: string
  cantidad: number
  subtotal: number
}

export interface Venta {
  id: string
  fecha: Date
  items: ItemVenta[]
  total: number
  metodo: MetodoPago
  vendedor: string
  clienteId: string | null
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string
  deuda: number
}

export interface MovimientoCaja {
  id: string
  hora: Date
  concepto: string
  tipo: 'ingreso' | 'egreso'
  monto: number
}

// Generador pseudoaleatorio con semilla (mulberry32)
function crearRng(semilla: number) {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = crearRng(20261108)
const entre = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
const elegir = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
const redondear = (n: number) => Math.round(n * 100) / 100

export const NEGOCIO = {
  nombre: 'Ferretería El Progreso',
  ruc: '10456789123',
  direccion: 'Av. Jesús 1204, Paucarpata, Arequipa',
  telefono: '954 321 678',
}

export const productos: Producto[] = [
  { id: 'P01', nombre: 'Cemento Portland 42.5 kg', categoria: 'Construcción', precio: 30, stock: 3, minimo: 20, unidad: 'bls.', emoji: '🧱' },
  { id: 'P02', nombre: 'Pintura Látex 1 gal', categoria: 'Pinturas', precio: 38, stock: 5, minimo: 12, unidad: 'gal', emoji: '🎨' },
  { id: 'P03', nombre: 'Tubo PVC 1/2" x 5 m', categoria: 'Gasfitería', precio: 9.5, stock: 8, minimo: 25, unidad: 'und.', emoji: '🔧' },
  { id: 'P04', nombre: 'Clavos 2" (kg)', categoria: 'Fijaciones', precio: 8, stock: 64, minimo: 20, unidad: 'kg', emoji: '📌' },
  { id: 'P05', nombre: 'Cable eléctrico N°14 (m)', categoria: 'Electricidad', precio: 2.8, stock: 420, minimo: 150, unidad: 'm', emoji: '⚡' },
  { id: 'P06', nombre: 'Fierro corrugado 3/8"', categoria: 'Construcción', precio: 27, stock: 46, minimo: 30, unidad: 'var.', emoji: '🏗️' },
  { id: 'P07', nombre: 'Codo PVC 1/2"', categoria: 'Gasfitería', precio: 1.5, stock: 180, minimo: 60, unidad: 'und.', emoji: '🔩' },
  { id: 'P08', nombre: 'Foco LED 12 W', categoria: 'Electricidad', precio: 7.5, stock: 14, minimo: 20, unidad: 'und.', emoji: '💡' },
  { id: 'P09', nombre: 'Thinner acrílico 1 L', categoria: 'Pinturas', precio: 12, stock: 33, minimo: 15, unidad: 'L', emoji: '🧴' },
  { id: 'P10', nombre: 'Lija de agua N°100', categoria: 'Pinturas', precio: 2, stock: 95, minimo: 40, unidad: 'plg.', emoji: '📄' },
  { id: 'P11', nombre: 'Martillo de uña 16 oz', categoria: 'Herramientas', precio: 32, stock: 11, minimo: 5, unidad: 'und.', emoji: '🔨' },
  { id: 'P12', nombre: 'Wincha 5 m', categoria: 'Herramientas', precio: 15, stock: 4, minimo: 6, unidad: 'und.', emoji: '📏' },
  { id: 'P13', nombre: 'Pegamento PVC 1/4 gal', categoria: 'Gasfitería', precio: 18, stock: 22, minimo: 10, unidad: 'und.', emoji: '🧪' },
  { id: 'P14', nombre: 'Tornillo autorroscante 1" (100)', categoria: 'Fijaciones', precio: 6, stock: 58, minimo: 20, unidad: 'cj.', emoji: '🪛' },
  { id: 'P15', nombre: 'Interruptor simple', categoria: 'Electricidad', precio: 6.5, stock: 37, minimo: 15, unidad: 'und.', emoji: '🔌' },
  { id: 'P16', nombre: 'Yeso 20 kg', categoria: 'Construcción', precio: 14, stock: 19, minimo: 10, unidad: 'bls.', emoji: '⬜' },
]

// Peso de popularidad para que el Top 5 sea realista
const popularidad: Record<string, number> = {
  P01: 10, P02: 6, P03: 7, P04: 6, P05: 8, P06: 4, P07: 7, P08: 4, P09: 3, P10: 4,
  P11: 1, P12: 2, P13: 3, P14: 3, P15: 3, P16: 2,
}
const bolsaProductos = productos.flatMap((p) => Array(popularidad[p.id]).fill(p) as Producto[])

const cantidadTipica = (p: Producto) => {
  if (p.unidad === 'm') return entre(5, 30)
  if (['P07', 'P10', 'P14'].includes(p.id)) return entre(2, 10)
  if (p.id === 'P01') return entre(1, 6)
  if (p.id === 'P04') return entre(1, 3)
  return entre(1, 3)
}

export const vendedores = ['Angel', 'Rosa', 'Jhon']

export const clientes: Cliente[] = [
  { id: 'C01', nombre: 'Constructora Misti S.A.C.', telefono: '959 112 334', deuda: 640 },
  { id: 'C02', nombre: 'Juan Quispe Mamani', telefono: '987 654 210', deuda: 0 },
  { id: 'C03', nombre: 'María Huamán Ccori', telefono: '951 220 871', deuda: 85 },
  { id: 'C04', nombre: 'Gasfitería Don Pepe', telefono: '974 300 556', deuda: 0 },
  { id: 'C05', nombre: 'Luis Condori Apaza', telefono: '958 447 102', deuda: 120 },
  { id: 'C06', nombre: 'Electro Sur E.I.R.L.', telefono: '962 510 093', deuda: 0 },
  { id: 'C07', nombre: 'Rosa Ticona Flores', telefono: '993 128 745', deuda: 0 },
  { id: 'C08', nombre: 'Pedro Mamani Cruz', telefono: '940 873 621', deuda: 230 },
  { id: 'C09', nombre: 'Inversiones Chilina', telefono: '956 701 488', deuda: 0 },
  { id: 'C10', nombre: 'Carmen Vilca Ramos', telefono: '981 662 019', deuda: 0 },
]

// ---- Ventas de los últimos 75 días hasta la hora actual ----
const ahora = new Date()
export const HOY = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

function generarVentas(): Venta[] {
  const lista: Venta[] = []
  for (let d = 74; d >= 0; d--) {
    const dia = new Date(HOY)
    dia.setDate(HOY.getDate() - d)
    const domingo = dia.getDay() === 0
    // Tendencia leve al alza + variación diaria
    const base = domingo ? 14 : 26
    const tickets = Math.round(base * (0.78 + (74 - d) * 0.0075) + entre(-4, 5))
    for (let t = 0; t < tickets; t++) {
      const hora = entre(8, domingo ? 13 : 19)
      const fecha = new Date(dia)
      fecha.setHours(hora, entre(0, 59), entre(0, 59))
      if (fecha > ahora) continue
      const nItems = rng() < 0.55 ? 1 : rng() < 0.7 ? 2 : 3
      const usados = new Set<string>()
      const items: ItemVenta[] = []
      for (let i = 0; i < nItems; i++) {
        const p = elegir(bolsaProductos)
        if (usados.has(p.id)) continue
        usados.add(p.id)
        const cantidad = cantidadTipica(p)
        items.push({ productoId: p.id, cantidad, subtotal: redondear(cantidad * p.precio) })
      }
      const total = redondear(items.reduce((s, i) => s + i.subtotal, 0))
      const r = rng()
      const metodo: MetodoPago = r < 0.6 ? 'Efectivo' : r < 0.88 ? 'Yape/Plin' : 'Tarjeta'
      lista.push({
        id: '',
        fecha,
        items,
        total,
        metodo,
        vendedor: elegir(vendedores),
        clienteId: rng() < 0.09 ? elegir(clientes).id : null,
      })
    }
  }
  // Numeración correlativa en orden cronológico
  lista.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
  lista.forEach((v, i) => (v.id = `B001-${String(i + 1).padStart(6, '0')}`))
  return lista.reverse()
}

export const ventas = generarVentas()

// ---- Caja del día ----
function generarCaja(): MovimientoCaja[] {
  const delDia = ventas.filter((v) => v.fecha >= HOY && v.metodo === 'Efectivo')
  const apertura = new Date(HOY)
  apertura.setHours(8, 0)
  const movs: MovimientoCaja[] = [
    { id: 'M0', hora: apertura, concepto: 'Apertura de caja', tipo: 'ingreso', monto: 200 },
  ]
  delDia
    .slice()
    .reverse()
    .forEach((v) => movs.push({ id: v.id, hora: v.fecha, concepto: `Venta ${v.id}`, tipo: 'ingreso', monto: v.total }))
  const egresos: [number, string, number][] = [
    [10, 'Pago a proveedor (clavos)', 180],
    [13, 'Almuerzo personal', 36],
    [16, 'Movilidad / delivery', 15],
  ]
  egresos.forEach(([h, concepto, monto], i) => {
    const hora = new Date(HOY)
    hora.setHours(h, 20)
    if (hora <= ahora) movs.push({ id: `E${i}`, hora, concepto, tipo: 'egreso', monto })
  })
  return movs.sort((a, b) => a.hora.getTime() - b.hora.getTime())
}

export const movimientosCaja = generarCaja()

export const productoPorId = Object.fromEntries(productos.map((p) => [p.id, p])) as Record<string, Producto>
export const clientePorId = Object.fromEntries(clientes.map((c) => [c.id, c])) as Record<string, Cliente>
