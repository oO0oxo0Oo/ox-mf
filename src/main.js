import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import vDraggable from './directives/draggable'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(ElementPlus)

// app.directive('draggable', vDraggable)
app.mount('#app')
