import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/api/ff-calendar': {
        target: 'https://nfs.faireconomy.media',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ff-calendar/, ''),
      },
      '/api/jblanked': {
        target: 'https://www.jblanked.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jblanked/, ''),
      },
    },
  },
})
