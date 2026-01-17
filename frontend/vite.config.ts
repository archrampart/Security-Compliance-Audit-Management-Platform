import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Lokal network'ten erişim için
    port: 4200,
    // Proxy kaldırıldı - API URL'i dinamik olarak belirlenecek
  },
  define: {
    // Backend URL'ini environment variable'dan al, yoksa localhost kullan
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
})

