import 'datatables.net-dt/css/dataTables.dataTables.css';
import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'

createApp(App).use(router).mount('#app')
