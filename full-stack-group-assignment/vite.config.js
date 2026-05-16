import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_ORIGIN || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      // Allow ngrok-hosted frontends to access the dev server
      allowedHosts: ['punctured-affirm-levitate.ngrok-free.dev', 'localhost'],
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
        '/socket.io': {
          target,
          ws: true,
          changeOrigin: true,
        },
        '/uploads': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
