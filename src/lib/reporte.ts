import { HOY, NEGOCIO, clientePorId, movimientosCaja, productoPorId, ventas, type MetodoPago } from '../data/mock'
import { dias, horaCorta, soles } from './stats'

/** Genera y descarga el reporte del día en PDF (jsPDF se carga solo al usarlo) */
export async function descargarReporteDelDia() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()
  const morado: [number, number, number] = [70, 70, 224]
  // Encabezados alineados a la derecha en las columnas numéricas
  const alinear = (cols: number[]) => ({
    didParseCell: (d: { section: string; column: { index: number }; cell: { styles: { halign?: string } } }) => {
      if (d.section === 'head' && cols.includes(d.column.index)) d.cell.styles.halign = 'right'
    },
  })

  const delDia = ventas.filter((v) => v.fecha >= HOY && v.fecha < dias(HOY, 1)).sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
  const total = delDia.reduce((s, v) => s + v.total, 0)
  const fecha = HOY.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Encabezado
  doc.setFillColor(...morado)
  doc.rect(0, 0, ancho, 78, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(NEGOCIO.nombre, 40, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`RUC ${NEGOCIO.ruc} · ${NEGOCIO.direccion}`, 40, 56)
  doc.setFontSize(11)
  doc.text('Reporte del día', ancho - 40, 36, { align: 'right' })
  doc.text(fecha.charAt(0).toUpperCase() + fecha.slice(1), ancho - 40, 56, { align: 'right' })

  // Resumen
  doc.setTextColor(30, 41, 59)
  const tarjetas = [
    ['Total vendido', soles(total)],
    ['Comprobantes', String(delDia.length)],
    ['Ticket promedio', soles(delDia.length ? total / delDia.length : 0)],
  ]
  tarjetas.forEach(([t, v], i) => {
    const x = 40 + i * ((ancho - 80) / 3)
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(t, x, 110)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(v, x, 130)
    doc.setFont('helvetica', 'normal')
  })

  // Por método de pago
  const metodos: MetodoPago[] = ['Efectivo', 'Yape/Plin', 'Tarjeta']
  autoTable(doc, {
    startY: 152,
    head: [['Método de pago', 'Ventas', 'Monto', '%']],
    body: metodos.map((m) => {
      const vs = delDia.filter((v) => v.metodo === m)
      const monto = vs.reduce((s, v) => s + v.total, 0)
      return [m, String(vs.length), soles(monto), `${total ? ((monto / total) * 100).toFixed(1) : '0.0'}%`]
    }),
    theme: 'grid',
    headStyles: { fillColor: morado },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    ...alinear([1, 2, 3]),
    margin: { left: 40, right: 40 },
  })

  // Caja
  const apertura = movimientosCaja.find((m) => m.concepto === 'Apertura de caja')?.monto ?? 0
  const ingresos = movimientosCaja.filter((m) => m.tipo === 'ingreso' && m.concepto !== 'Apertura de caja').reduce((s, m) => s + m.monto, 0)
  const egresos = movimientosCaja.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  autoTable(doc, {
    head: [['Caja (efectivo)', 'Monto']],
    body: [
      ['Apertura', soles(apertura)],
      ['Ingresos', soles(ingresos)],
      ['Egresos', soles(egresos)],
      ['Efectivo esperado', soles(apertura + ingresos - egresos)],
    ],
    theme: 'grid',
    headStyles: { fillColor: morado },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    ...alinear([1]),
    margin: { left: 40, right: 40 },
  })

  // Productos más vendidos del día
  const acc = new Map<string, { c: number; m: number }>()
  delDia.forEach((v) =>
    v.items.forEach((i) => {
      const a = acc.get(i.productoId) ?? { c: 0, m: 0 }
      a.c += i.cantidad
      a.m += i.subtotal
      acc.set(i.productoId, a)
    }),
  )
  autoTable(doc, {
    head: [['Producto', 'Cantidad', 'Monto']],
    body: [...acc.entries()]
      .sort((a, b) => b[1].m - a[1].m)
      .slice(0, 8)
      .map(([id, a]) => [productoPorId[id]?.nombre ?? id, `${a.c} ${productoPorId[id]?.unidad ?? ''}`, soles(a.m)]),
    theme: 'grid',
    headStyles: { fillColor: morado },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    ...alinear([1, 2]),
    margin: { left: 40, right: 40 },
  })

  // Detalle de comprobantes
  autoTable(doc, {
    head: [['Comprobante', 'Hora', 'Cliente', 'Método', 'Total']],
    body: delDia.map((v) => [v.id, horaCorta(v.fecha), v.clienteId ? clientePorId[v.clienteId]?.nombre ?? '—' : 'Público general', v.metodo, soles(v.total)]),
    theme: 'striped',
    headStyles: { fillColor: morado },
    styles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right' } },
    ...alinear([4]),
    margin: { left: 40, right: 40 },
  })

  // Pie de página
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Generado el ${new Date().toLocaleString('es-PE')} · Página ${i} de ${paginas}`, ancho / 2, doc.internal.pageSize.getHeight() - 24, { align: 'center' })
  }

  doc.save(`reporte-${HOY.toISOString().slice(0, 10)}.pdf`)
}
