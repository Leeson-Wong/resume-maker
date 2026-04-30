import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 1053,
    proxy: {
      '/mcp': 'http://localhost:965',
      '/api': 'http://localhost:965',
    },
  },
})
