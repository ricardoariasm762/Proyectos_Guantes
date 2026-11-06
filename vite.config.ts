import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
      ],
      manifest: {
        name: 'Herramienta Digital Guantes',
        short_name: 'Guantes',
        description:
          'Simulador de técnica estéril para el aprendizaje de la postura cerrada de guantes quirúrgicos.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#023E8A',
        background_color: '#F8FAFC',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,webmanifest}',
          'frames/v3/*.webp',
          'wasm/*.{js,wasm}',
          'models/hand_landmarker.task',
          'modelo_tfjs/*.{json,bin}',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/swagger-ui/,
          /^\/v3\/api-docs/,
          /^\/actuator/,
          /^\/sw\.js$/,
          /^\/manifest\.webmanifest$/,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') ||
              url.pathname.startsWith('/swagger-ui') ||
              url.pathname.startsWith('/v3/api-docs') ||
              url.pathname.startsWith('/actuator'),
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
