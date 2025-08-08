import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
// import vDraggable from './directives/draggable'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)

// app.directive('draggable', vDraggable)
app.mount('#app')
