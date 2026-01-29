import 'simplewebdesign'
import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import PlanView from './views/PlanView.vue'
import dataService from './services/data.service'
import PlanListView from './views/PlanListView.vue'
import surrealdbService, { auth } from './services/surrealdb.service'
import LoginView from './views/LoginView.vue'
import type { BeforeInstallPromptEvent } from './core/types'
import ProfileView from './views/ProfileView.vue'
import PlanEditView from './views/PlanEditView.vue'
import weatherService from './services/weather.service'
import WeatherView from './views/WeatherView.vue'
import FileView from './views/FileView.vue'
import DesignView from './views/DesignView.vue'
import PostEditView from './views/PostEditView.vue'
import UserView from './views/UserView.vue'
import UserEditView from './views/UserEditView.vue'
import dialogService from './services/dialog.service'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, beforeEnter: auth() },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/plan', name: 'plans', component: PlanListView, beforeEnter: auth() },
    { path: '/plan/:id', name: 'plan', component: PlanView, beforeEnter: auth() },
    { path: '/plan/edit/:id', name: 'plan-edit', component: PlanEditView, beforeEnter: auth() },
    { path: '/file', name: 'files', component: FileView, beforeEnter: auth() },
    { path: '/file/:id', name: 'file', component: FileView, beforeEnter: auth() },
    { path: '/post/:id', name: 'post-edit', component: PostEditView, beforeEnter: auth() },
    { path: '/weather', name: 'weather', component: WeatherView, beforeEnter: auth() },
    { path: '/profile', name: 'profile', component: ProfileView, beforeEnter: auth() },
    { path: '/user', name: 'user', component: UserView, beforeEnter: auth(user => user.admin) },
    { path: '/user/:id', name: 'user-edit', component: UserEditView, beforeEnter: auth(user => user.admin) },
    { path: '/design', name: 'design', component: DesignView, beforeEnter: auth() },
  ],
})

export let pwa: BeforeInstallPromptEvent | undefined = undefined

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  pwa = event as BeforeInstallPromptEvent
})

const app = createApp(App)
app.use(router)
app.use(dialogService)
app.use(surrealdbService)
app.use(weatherService)
app.use(dataService)
app.mount('#app')
