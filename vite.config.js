import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
})


// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     proxy: {
//       // 當你的請求路徑以 /api 開頭時，會自動轉發
//       '/api': {
//         target: 'http://your-backend-api-server.com', // 真實後端位置
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, '') // 視後端路徑決定是否移除 /api 前綴
//       }
//     }
//   }
// })