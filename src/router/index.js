import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import Dashboard from '../components/Dashboard.vue';
import Users from '../views/Users.vue';
import Reservations from '../views/Reservations.vue';
import Vehicles from '../views/Vehicles.vue';
import Approvals from '../views/Approvals.vue';
import Schedule from '../views/Schedule.vue';
import Contact from '../views/Contact.vue';
import Todo from '../views/Todo.vue';
import { supabase } from '../supabase';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path: 'reservations',
        name: 'Reservations',
        component: Reservations,
        meta: { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: Vehicles,
        meta: { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: Approvals,
        meta: { requiresAuth: true, roles: ['Manager'] },
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: Schedule,
        meta: { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path: 'contact',
        name: 'Contact',
        component: Contact,
        meta: { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path: 'todo',
        name: 'Todo',
        component: Todo,
        meta: { requiresAuth: true, roles: ['Manager'] },
      },
    ],
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

// Middleware for auth check
router.beforeEach(async (to, from, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Ambil role user dari tabel users
      const { data: rolesData, error } = await supabase
        .from('users')
        .select('roles(name)')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user roles:', error);
        next('/login');
        return;
      }

      const role = rolesData?.roles?.name;

      // Jika pengguna mencoba akses halaman login
      if (to.path === '/login') {
        if (role === 'Manager') {
          next({ name: 'Todo' });
        } else if (role === 'Admin') {
          next('/');
        } else {
          next('/');
        }
        return;
      }

      // Periksa role berdasarkan meta.role
      if (to.meta.requiresAuth) {
        const allowedRoles = to.meta.roles || [];
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
          console.warn(`Access denied to ${to.path} for role ${role}`);
          if (role === 'Manager') {
            next({ name: 'Todo' });
          } else if (role === 'Admin') {
            next('/');
          } else {
            next('/login');
          }
          return;
        }
      }
    }

    // Jika halaman memerlukan autentikasi tetapi pengguna tidak memiliki sesi
    if (to.meta.requiresAuth && !session) {
      next('/login');
    } else {
      next();
    }
  } catch (error) {
    console.error('Error checking auth session:', error);
    next('/login');
  }
});

export default router;
