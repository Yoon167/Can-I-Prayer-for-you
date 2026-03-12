import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'

if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  registerSW({
    immediate: false,
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
