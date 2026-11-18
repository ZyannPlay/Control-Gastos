/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Mis Gastos',
        short_name: 'Gastos',
        description: 'Control de gastos en pesos y dólares',
        lang: 'es-AR',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dolarapi\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'fx', expiration: { maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 600 },
  test: { environment: 'jsdom', globals: true },
})
