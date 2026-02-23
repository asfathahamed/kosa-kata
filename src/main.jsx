import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '../style.css'

const root = document.getElementById('reel-canvas') || document.getElementById('root')
// If there's no container with id 'root', keep the existing DOM and render into the existing reel-canvas
if (root) {
  createRoot(root).render(<App />)
} else {
  const mount = document.createElement('div')
  mount.id = 'root'
  document.body.appendChild(mount)
  createRoot(mount).render(<App />)
}
