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
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/invite/:token',
    name: 'invite',
    component: () => import('@/views/InviteAcceptView.vue'),
    meta: { public: true },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { bare: true },
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
    component: () => import('@/views/demand/DemandFormView.vue'),
  },
  {
    path: '/office',
    name: 'office',
    component: () => import('@/views/office/OfficeView.vue'),
  },
  {
    path: '/users/:id',
    name: 'profile',
    component: () => import('@/views/users/ProfileView.vue'),
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

  // Kimliği doğrulanmamış kullanıcı public olmayan sayfalara erişemez
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // Girişli kullanıcı login/register'a giderse uygun yere yönlendir
  if (auth.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    return auth.hasOffice ? { name: 'dashboard' } : { name: 'onboarding' };
  }

  // Ofisi olmayan girişli kullanıcı önce onboarding'i tamamlamalı
  // (davet sayfası hariç — davetle ofise katılabilsin)
  if (
    auth.isAuthenticated &&
    !auth.hasOffice &&
    to.name !== 'onboarding' &&
    to.name !== 'invite'
  ) {
    return { name: 'onboarding' };
  }

  // Ofisi olan kullanıcı onboarding'e gitmeye çalışırsa dashboard'a
  if (auth.isAuthenticated && auth.hasOffice && to.name === 'onboarding') {
    return { name: 'dashboard' };
  }

  if (to.meta.adminOnly && !auth.isAdmin) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
