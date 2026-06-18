import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/elevenlabs': {
        target: 'https://api.elevenlabs.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/elevenlabs/, '')
      },
      '/api/itera': {
        target: 'https://api.itera102.space',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/itera/, '')
      },
      '/api/google-tts': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-tts/, '')
      }
    }
  }
})
