import 'simplewebdesign'
import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ShiftView from './views/ShiftView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/shift', name: 'shift-list', component: ShiftView },
    { path: '/shift/:id', name: 'shift', component: ShiftView }
  ],
})

const app = createApp(App)

app.use(router)

app.mount('#app')
