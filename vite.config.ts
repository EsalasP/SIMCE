import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  // En GitHub Pages la app vive en /simce-brasilia/ — cambiar si el repo tiene otro nombre
  base: process.env.GITHUB_ACTIONS ? '/SIMCE/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
