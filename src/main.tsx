import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// En la vista previa embebida se usa MemoryRouter (el visor no permite rutas en el hash)
const Router = import.meta.env.VITE_PREVIEW ? MemoryRouter : HashRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
