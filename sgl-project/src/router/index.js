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
      path: '/admin', 
      name: 'admin', 
      component: () => import('../views/Admin/Home.vue'),
      meta: { requiresAuth: true, role: 'admin' } 
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
    },
    {
      path: '/donaciones',
      name: 'donaciones',
      component: () => import('../views/Admin/Donaciones.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/tablabitacoras',
      name: 'tablabitacoras',
      component: () => import('../views/Global/TablaBitacoras.vue'),
      meta: { requiresAuth: true}
    },
    {
      path: '/director',
      name: 'director',
      component: () => import('../views/Director/Home.vue'),
      meta: { requiresAuth: true, role: 'director' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Director/Dashboard.vue'),
      meta: { requiresAuth: true, role: 'director' }
    },
    {
      path: '/flota',
      name: 'flota',
      component: () => import('../views/Director/Flota.vue'),
      meta: { requiresAuth: true, role: 'director' }
    },
    {
      path: '/desarrollo',
      name: 'desarrollo',
      component: () => import('../views/Desarrollo/Home.vue'),
      meta: { requiresAuth: true, role: 'desarrollo' }
    },
    {
      path: '/bitacoradesarrollo',
      name: 'bitacoradesarrollo',
      component: () => import('../views/Desarrollo/Bitacora.vue'),
      meta: { requiresAuth: true, role: 'desarrollo' }
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('../views/Desarrollo/Configuracion.vue'),
      meta: { requiresAuth: true, role: 'desarrollo' }
    }
  ]
})

router.beforeEach((to) => {
  // 1. Extraemos el objeto usuario del localStorage
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  // 2. Si la ruta requiere auth y no hay usuario -> al Login
  if (to.meta.requiresAuth && !user) {
    return { name: 'login' };
  }

  // 3. Validación de Roles
  if (to.meta.role && user) {
    // Forzamos minúsculas para evitar errores de "Admin" vs "admin"
    const rolUsuario = user.rol.toLowerCase();
    const rolRequerido = to.meta.role.toLowerCase();

    if (rolUsuario !== rolRequerido) {
      console.warn(`Bloqueado: necesitas ${rolRequerido}, tienes ${rolUsuario}`);
      return rolUsuario === 'admin' ? { name: 'admin' } : { name: 'home' };
    }
  }
});

export default router