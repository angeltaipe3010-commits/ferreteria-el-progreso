import { useEffect, useState } from 'react'

/** Devuelve true si está activo el modo oscuro (escucha los cambios de clase en <html>) */
export function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

/** Paleta validada (contraste y daltonismo) para claro y oscuro */
export function useChartColors() {
  const dark = useDark()
  return dark
    ? {
        serie: ['#6d6ff5', '#0d9488', '#d97706'],
        principal: '#818cf8',
        grid: '#232325',
        eje: '#8a8a93',
        superficie: '#141414',
        tooltip: { bg: '#141414', border: '#333336', text: '#f4f4f5' },
      }
    : {
        serie: ['#4646e0', '#14b8a6', '#f59e0b'],
        principal: '#4646e0',
        grid: '#eef2f7',
        eje: '#94a3b8',
        superficie: '#ffffff',
        tooltip: { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a' },
      }
}
