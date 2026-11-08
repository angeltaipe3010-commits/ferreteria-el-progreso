import { HOY, productos, productoPorId, ventas, type MetodoPago, type Venta } from '../data/mock'

export const soles = (n: number, dec = 2) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const fechaCorta = (d: Date) => d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
export const horaCorta = (d: Date) => d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

const sumar = (vs: Venta[]) => vs.reduce((s, v) => s + v.total, 0)

export function ventasEntre(desde: Date, hasta: Date) {
  return ventas.filter((v) => v.fecha >= desde && v.fecha < hasta)
}

const dias = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function kpis() {
  const ahora = new Date()
  const manana = dias(HOY, 1)
  const hoy = ventasEntre(HOY, manana)

  // Mismo día de la semana pasada, hasta la misma hora
  const semanaPasada = dias(HOY, -7)
  const corte = new Date(ahora)
  corte.setDate(corte.getDate() - 7)
  const hoyAnterior = ventasEntre(semanaPasada, corte)

  const inicioMes = new Date(HOY.getFullYear(), HOY.getMonth(), 1)
  const mes = ventasEntre(inicioMes, manana)
  // Mismo tramo del mes anterior
  const inicioMesAnt = new Date(HOY.getFullYear(), HOY.getMonth() - 1, 1)
  const finTramoAnt = new Date(HOY.getFullYear(), HOY.getMonth() - 1, HOY.getDate() + 1)
  const mesAnt = ventasEntre(inicioMesAnt, finTramoAnt)

  const ticket = mes.length ? sumar(mes) / mes.length : 0
  const ticketAnt = mesAnt.length ? sumar(mesAnt) / mesAnt.length : 0

  const variacion = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0)

  return {
    ventasHoy: sumar(hoy),
    ticketsHoy: hoy.length,
    varHoy: variacion(sumar(hoy), sumar(hoyAnterior)),
    ventasMes: sumar(mes),
    ticketsMes: mes.length,
    varMes: variacion(sumar(mes), sumar(mesAnt)),
    ticket,
    varTicket: variacion(ticket, ticketAnt),
    stockBajo: productos.filter((p) => p.stock < p.minimo).length,
  }
}

export function serieDiaria(nDias: number) {
  const out: { fecha: string; ventas: number; tickets: number }[] = []
  for (let i = nDias - 1; i >= 0; i--) {
    const d = dias(HOY, -i)
    const vs = ventasEntre(d, dias(d, 1))
    out.push({ fecha: i === 0 ? 'Hoy' : fechaCorta(d), ventas: Math.round(sumar(vs)), tickets: vs.length })
  }
  return out
}

/** Pequeña serie para los sparklines de las tarjetas */
export function sparkline(metric: 'ventas' | 'tickets' | 'ticket', n = 14) {
  return serieDiaria(n).map((d) => ({
    v: metric === 'ticket' ? (d.tickets ? d.ventas / d.tickets : 0) : d[metric],
  }))
}

export function metodosPagoMes() {
  const inicioMes = new Date(HOY.getFullYear(), HOY.getMonth(), 1)
  const mes = ventasEntre(inicioMes, dias(HOY, 1))
  const metodos: MetodoPago[] = ['Efectivo', 'Yape/Plin', 'Tarjeta']
  const total = sumar(mes)
  return metodos.map((m) => {
    const monto = sumar(mes.filter((v) => v.metodo === m))
    return { metodo: m, monto, pct: total ? (monto / total) * 100 : 0 }
  })
}

export function topProductos(desde: Date, n = 5) {
  const acc = new Map<string, { cantidad: number; monto: number }>()
  ventas
    .filter((v) => v.fecha >= desde)
    .forEach((v) =>
      v.items.forEach((i) => {
        const a = acc.get(i.productoId) ?? { cantidad: 0, monto: 0 }
        a.cantidad += i.cantidad
        a.monto += i.subtotal
        acc.set(i.productoId, a)
      }),
    )
  return [...acc.entries()]
    .map(([id, a]) => ({ producto: productoPorId[id], ...a }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, n)
}

export function inicioMesActual() {
  return new Date(HOY.getFullYear(), HOY.getMonth(), 1)
}

export function nombreMes(d = HOY) {
  const s = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export { dias }
