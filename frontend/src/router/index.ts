import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router';
import routes from './routes';

const createHistory = process.env.SERVER ? createMemoryHistory : createWebHistory;

const router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,
  history: createHistory(process.env.VUE_ROUTER_BASE),
});

router.beforeEach((to, _from, next) => {
  const requiresAuth: boolean = to.matched.some((record) => record.meta.requiresAuth);
  const token: string | null = localStorage.getItem('auth_token');

  if (requiresAuth && !token) {
    next({ name: 'admin-login' });
  } else {
    next();
  }
});

export default router;
