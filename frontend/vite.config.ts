import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

<<<<<<< HEAD
=======
// Tailwind v4 подключается через плагин — postcss.config.js и
// tailwind.config.js больше НЕ нужны, их можно удалить.
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
<<<<<<< HEAD
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // В Docker VITE_BACKEND_URL=http://backend:8000, локально — localhost:8000
=======
    proxy: {
      '/api': {
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
