import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
      //   api will forward it to localhost:3000 (Backend server)
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
