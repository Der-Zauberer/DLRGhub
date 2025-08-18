import 'simplewebdesign'
import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ShiftView from './views/ShiftView.vue'
import dataService from './services/data.service'
import PlanView from './views/PlanView.vue'
import surrealdbService, { auth } from './services/surrealdb.service'
import LoginView from './views/LoginView.vue'
import type { BeforeInstallPromptEvent } from './core/types'
import ProfileView from './views/ProfileView.vue'
import ShiftEditView from './views/ShiftEditView.vue'
import weatherService from './services/weather.service'
import WeatherView from './views/WeatherView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, beforeEnter: auth},
    { path: '/login', name: 'login', component: LoginView },
    { path: '/shift', name: 'plans', component: PlanView, beforeEnter: auth },
    { path: '/shift/:id', name: 'shifts', component: ShiftView, beforeEnter: auth },
    { path: '/shift/edit/:id', name: 'shift-edit', component: ShiftEditView, beforeEnter: auth },
    { path: '/weather', name: 'weather', component: WeatherView, beforeEnter: auth },
    { path: '/profile', name: 'profile', component: ProfileView, beforeEnter: auth },
  ],
})

export let pwa: BeforeInstallPromptEvent | undefined = undefined

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  pwa = event as BeforeInstallPromptEvent
})

const app = createApp(App)
app.use(router)
app.use(surrealdbService)
app.use(dataService)
app.use(weatherService)
app.mount('#app')
