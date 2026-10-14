import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pomokitty/' : '/',
  server: {
    host: '127.0.0.1',
    port: Number(process.env.POMOKITTY_E2E_PORT ?? 5173),
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  plugins: [
    ...react(),
    ...VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'pomokitty',
        short_name: 'pomokitty',
        description: 'Спокойный таймер фокуса для детей: одно дело, короткий отдых и котики за внимание.',
        id: '/pomokitty/app/',
        start_url: '/pomokitty/app/',
        scope: '/pomokitty/app/',
        display: 'standalone',
        theme_color: '#99432c',
        background_color: '#fffaf1',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,mp3,opus}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}))
