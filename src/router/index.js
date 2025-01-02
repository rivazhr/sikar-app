import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import Dashboard from '../components/Dashboard.vue';
import Users from '../views/Users.vue';
import Reservations from '../views/Reservations.vue';
import Vehicles from '../views/Vehicles.vue';
import Approvals from '../views/Approvals.vue';
import Schedule from '../views/Schedule.vue';
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
      },
      {
        path: '/users',
        name: 'Users',
        component: Users,
      },
      {
        path: '/reservations',
        name: 'Reservations',
        component: Reservations,
      },
      {
        path: '/vehicles',
        name: 'Vehicles',
        component: Vehicles,
      },
      {
        path: '/approvals',
        name: 'Approvals',
        component: Approvals,
      },
      {
        path: '/schedule',
        name: 'Schedule',
        component: Schedule,
      },
    ],
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Middleware for auth check
router.beforeEach(async (to, from, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (to.path === '/login' && session) {
      next('/');
    } else if (to.meta.requiresAuth && !session) {
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
