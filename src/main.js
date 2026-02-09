import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import axios from 'axios';

const app = createApp(App)
app.use(Antd).mount('#app')
// 設定基礎路徑
axios.defaults.baseURL = 'http://your-api-server.com:8080'; 

// 設定超時時間（選填）
axios.defaults.timeout = 10000;

// 設定預設 Header（選填）
axios.defaults.headers.post['Content-Type'] = 'application/json'