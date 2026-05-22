import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
  },
  {
    path: '/portfolio',
    name: 'portfolio.list',
    component: () => import('@/views/portfolio/PortfolioListView.vue'),
  },
  {
    path: '/portfolio/new',
    name: 'portfolio.new',
    component: () => import('@/views/portfolio/PortfolioFormView.vue'),
  },
  {
    path: '/portfolio/:id',
    name: 'portfolio.detail',
    component: () => import('@/views/portfolio/PortfolioDetailView.vue'),
  },
  {
    path: '/portfolio/:id/edit',
    name: 'portfolio.edit',
    component: () => import('@/views/portfolio/PortfolioFormView.vue'),
  },
  {
    path: '/demand',
    name: 'demand.list',
    component: () => import('@/views/demand/DemandListView.vue'),
  },
  {
    path: '/demand/new',
    name: 'demand.new',
    component: () => import('@/views/demand/DemandFormView.vue'),
  },
  {
    path: '/demand/:id',
    name: 'demand.detail',
    component: () => import('@/views/demand/DemandDetailView.vue'),
  },
  {
    path: '/demand/:id/edit',
    name: 'demand.edit',
    component: () => import('@/views/demand/DemandFormView.vue'),
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { adminOnly: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.public && auth.isAuthenticated && to.name === 'login') {
    return { name: 'dashboard' };
  }
  if (to.meta.adminOnly && !auth.isAdmin) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
