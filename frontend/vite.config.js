import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { assertPublicEnvironment } from './config/public-environment.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'protect-public-environment',
    configResolved(config) { assertPublicEnvironment(config.env) },
  }],
  build: { sourcemap: false },
})
