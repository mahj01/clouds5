import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import MapPage from '@/views/MapPage.vue';
import LoginPage from '@/views/LoginPage.vue';
import SignalementsPage from '@/views/SignalementsPage.vue';
import RecapitulatifSignalementPage from '@/views/RecapitulatifSignalementPage.vue';
import MySignalementsPage from '@/views/MySignalementsPage.vue';


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
  {
    path: '/signalements',
    name: 'Signalements',
    component: SignalementsPage,
  },
  {
    path: '/recap-signalements',
    name: 'RecapSignalements',
    component: RecapitulatifSignalementPage,
  },
  {
    path: '/mes-signalements',
    name: 'MesSignalements',
    component: MySignalementsPage,
  },

]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
