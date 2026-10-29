import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { weddingApiPlugin } from './api-plugin.js'

export default defineConfig({
  // Mã phiên bản app cho thuộc tính chung của sự kiện analytics (7 ký tự của commit; 'dev' khi chạy local).
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'),
  },
  plugins: [react(), tailwindcss(), weddingApiPlugin()],
})
