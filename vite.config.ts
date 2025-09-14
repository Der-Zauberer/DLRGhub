import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'DLRG',
        short_name: 'DLRG',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e30613',
        icons: [
          {
            src: 'resources/logo/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'resources/logo/logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ttf,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'dlrg.derzauberer.eu',
            handler: 'NetworkOnly',
            options: {
              cacheName: 'external-resources',
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
