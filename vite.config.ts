import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'kosa-kata',
      filename: 'remoteEntry.js',
      exposes: {
        './ReelApp': './src/App.tsx'
      }
    })
  ],
  server: {
    port: 5173
  }
})
