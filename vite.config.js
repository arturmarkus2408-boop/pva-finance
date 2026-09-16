import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Запросы к почтовому ящику не должны перехватываться офлайн-кэшем:
      // без этого service worker подменяет ответ /api на index.html
      workbox: {
        navigateFallbackDenylist: [/^\/api\//]
      },
      manifest: {
        name: 'Wallet',
        short_name: 'Wallet',
        description: 'Личный учёт финансов',
        theme_color: '#0D1422',
        background_color: '#0D1422',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ],
        // Приём текста из «Поделиться»: выделяете SMS от банка -> Поделиться -> Wallet.
        // Текст прилетает в ?text=... и разбирается офлайн, без API-ключа.
        share_target: {
          action: '/',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        // Быстрые действия по долгому нажатию на иконку приложения
        shortcuts: [
          { name: 'Расход', short_name: 'Расход', url: '/?quick=expense' },
          { name: 'Доход', short_name: 'Доход', url: '/?quick=income' }
        ]
      }
    })
  ],
})
