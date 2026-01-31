import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import MapPage from '@/views/MapPage.vue';
import LoginPage from '@/views/LoginPage.vue';


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home',
    name: 'Home', 
    component: HomePage
  },
  {
    path: '/map',
    name: 'Map', 
    component: MapPage
  },
  {
    path: '/login',
    name: 'Login', 
    component: LoginPage
  },
  
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
