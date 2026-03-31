import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/Login/Loginview.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { 
      path: '/home', 
      name: 'home', 
      component: () => import('../views/Operador/Home.vue'),
      meta: { requiresAuth: true, role: 'operador' } 
    },
    { 
      path: '/admin', 
      name: 'admin', 
      component: () => import('../views/Admin/Home.vue'),
      meta: { requiresAuth: true, role: 'admin' } 
    },
    {
      path: '/bitacora',
      name: 'bitacora',
      component: () => import('../views/Operador/Bitacora.vue'),
      meta: { requiresAuth: true, role: 'operador' }
    },
    {
      path: '/mapa',
      name: 'mapa',
      component: () => import('../views/Operador/Mapa.vue'),
      meta: { requiresAuth: true, role: 'operador' }
    },
      {
      path: '/gestion',
      name: 'gestion',
      component: () => import('../views/Admin/Gestion.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
      {
      path: '/rutas',
      name: 'rutas',
      component: () => import('../views/Admin/Rutas.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    }
  ]
})

router.beforeEach((to) => {
  const isAuthenticated = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');

  // 1. Si requiere auth y no está logueado -> al Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' };
  }

  // 2. Si tiene rol pero no coincide
  if (to.meta.role && to.meta.role !== userRole) {
    console.warn(`Bloqueado: necesitas ${to.meta.role}, tienes ${userRole}`);
    if (userRole === 'admin') return { name: 'admin' };
    if (userRole === 'operador') return { name: 'home' };
    return { name: 'login' };
  }

  // Si todo está bien, no retornes nada (equivale a dejar pasar)
});

export default router