import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://chefit-backend.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      },
    },
    host: true, // Listen on all addresses
    port: 8080  // Match Azure's expected port
  },
  preview: {
    port: 8080 // Also set preview port for consistency
  }
});