import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon-180x180.png', 'favicon.svg'],
      manifest: {
        name: '凑24 · Make24',
        short_name: '凑24',
        description: '随时随地来一局 24 点',
        theme_color: '#172554',
        background_color: '#fffaf0',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '.',
        lang: 'zh-CN',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: 'index.html'
      },
      devOptions: { enabled: true }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  }
})
