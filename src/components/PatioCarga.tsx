import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useDark } from '../lib/useDark'
import type { Patio } from '../scene/patio'

/** Ilustración animada en 3D del patio de carga de la ferretería */
export default function PatioCarga() {
  const host = useRef<HTMLDivElement>(null)
  const patio = useRef<Patio | null>(null)
  const dark = useDark()
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let vivo = true
    let io: IntersectionObserver | undefined
    let ro: ResizeObserver | undefined
    let visible = true
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const actualizar = () => {
      const p = patio.current
      if (!p) return
      if (visible && !document.hidden) p.play()
      else p.pause()
    }

    import('../scene/patio').then(({ Patio }) => {
      if (!vivo) return
      try {
        patio.current = new Patio(el, document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro', reducir)
      } catch {
        return // sin WebGL: se queda el fondo degradado
      }
      setListo(true)
      ro = new ResizeObserver(() => patio.current?.resize())
      ro.observe(el)
      // Solo anima cuando está en pantalla y la pestaña está activa
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        actualizar()
      })
      io.observe(el)
      document.addEventListener('visibilitychange', actualizar)
      actualizar()
    })

    return () => {
      vivo = false
      io?.disconnect()
      ro?.disconnect()
      document.removeEventListener('visibilitychange', actualizar)
      patio.current?.dispose()
      patio.current = null
    }
  }, [])

  useEffect(() => {
    patio.current?.setTema(dark ? 'oscuro' : 'claro')
  }, [dark])

  return (
    // Sin tarjeta: la escena se funde con el fondo de la página con bordes difuminados
    <div className="patio-difuminado relative h-80 sm:h-96" aria-hidden="true">
      <motion.div ref={host} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: listo ? 1 : 0 }} transition={{ duration: 0.8 }} />
    </div>
  )
}
