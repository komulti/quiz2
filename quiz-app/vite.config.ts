import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vercel은 루트(/)에 배포, GitHub Pages는 /quiz2/ 하위에 배포
const base = process.env.VERCEL ? '/' : (process.env.VITE_BASE_PATH ?? '/quiz2/');

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '고졸 검정고시 퀴즈',
        short_name: '검정고시 퀴즈',
        description: '고졸 검정고시 기출문제 퀴즈 챌린지',
        theme_color: '#be185d',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: new RegExp(`^${base}data/`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'quiz-data',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          store: ['zustand'],
        },
      },
    },
  },
});
