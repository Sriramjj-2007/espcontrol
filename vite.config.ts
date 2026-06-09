import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: true
  },
  base: '/espcontrol/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when new changes are deployed
      // includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-able-icon.png'],
      manifest: {
        name: 'ESP Control',
        short_name: 'ESPControl',
        description: 'ESP Remote Controller',
        theme_color: '#1f6feb',
        background_color: '#0b0f13',
        display: 'standalone', // Makes it feel like a native mobile/desktop app
        orientation: 'landscape',
        start_url: '.',
        icons: [
          {
            src: 'icon.png',
            sizes: '480x480',
            type: 'image/png',
            purpose: 'any maskable' // Required for seamless Android icons
          }
        ]
      }
    })

  ]
})
