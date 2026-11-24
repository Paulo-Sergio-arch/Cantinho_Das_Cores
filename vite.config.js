import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => {
  // Na Vercel (ou quando VITE_BASE_PATH='/'), publica na raiz '/'.
  // No GitHub Pages (build padrão), usa '/Cantinho_Das_Cores/'.
  const isVercel = Boolean(process.env.VERCEL)
  const customBase = process.env.VITE_BASE_PATH
  const prodBase = customBase || (isVercel ? '/' : '/Cantinho_Das_Cores/')

  return {
    base: command === 'build' || isPreview ? prodBase : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5185,
    },
  }
})
