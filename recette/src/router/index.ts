import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '@/views/TabsPage.vue';


const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/recettes' },
  { path: '/tabs', component: TabsPage, children: [
    { path: '', redirect: '/tabs/recettes' },
    { path: 'recettes',              component: () => import('@/views/RecettesPage.vue') },
    { path: 'recettes/nouvelle',     component: () => import('@/views/RecetteFormPage.vue') },
    { path: 'recettes/:id',          component: () => import('@/views/RecetteDetailPage.vue') },
    // { path: 'recettes/:id/modifier', component: () => import('@/views/RecetteFormPage.vue') },
  ]}
];



export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

