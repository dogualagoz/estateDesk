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
    name: 'invite.preview',
    component: () => import('@/views/InvitePreviewView.vue'),
    meta: { public: true },
  },
  {
    path: '/invite/:token/register',
    name: 'invite.register',
    component: () => import('@/views/InviteRegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/invite/:token/accept',
    name: 'invite.accept',
    component: () => import('@/views/InviteAcceptView.vue'),
    meta: { public: true },
  },
  {
    path: '/invite/success',
    name: 'invite.success',
    component: () => import('@/views/InviteSuccessView.vue'),
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
    name: 'landing',
    component: () => import('@/views/landing/LandingView.vue'),
    meta: { public: true, bare: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  // ── Demo: geçici, salt-okunur oturumla aynı ekranlar ──
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/views/DashboardView.vue'),
    meta: { demo: true },
  },
  {
    path: '/demo/portfolio',
    name: 'demo.portfolio',
    component: () => import('@/views/portfolio/PortfolioListView.vue'),
    meta: { demo: true },
  },
  {
    path: '/demo/demand',
    name: 'demo.demand',
    component: () => import('@/views/demand/DemandListView.vue'),
    meta: { demo: true },
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

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // ── Demo route'ları: geçici oturum yoksa otomatik aç ──
  if (to.meta.demo) {
    // Gerçek hesapla girişli kullanıcı demo'ya gitmesin, kendi paneline gitsin
    if (auth.isRealAuth) {
      return auth.hasOffice ? { name: 'dashboard' } : { name: 'onboarding' };
    }
    if (!auth.isDemoSession) {
      try {
        await auth.loginDemo();
      } catch {
        return { name: 'landing' };
      }
    }
    return true;
  }

  // Kimliği doğrulanmamış kullanıcı public olmayan sayfalara erişemez
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // Girişli kullanıcı davet preview sayfasına girerse direkt accept view'e yönlendir
  if (auth.isRealAuth && to.name === 'invite.preview') {
    return { name: 'invite.accept', params: { token: to.params.token } };
  }

  // Giriş yapmamış kullanıcı accept view'e girerse preview'e yönlendir
  if (!auth.isAuthenticated && to.name === 'invite.accept') {
    return { name: 'invite.preview', params: { token: to.params.token } };
  }

  // Gerçek hesapla girişli kullanıcı landing/login/register'a giderse uygun yere yönlendir
  // (Demo oturumu bunu tetiklemez; demo kullanıcı siteye geri dönebilsin.)
  if (
    auth.isRealAuth &&
    (to.name === 'landing' || to.name === 'login' || to.name === 'register')
  ) {
    return auth.hasOffice ? { name: 'dashboard' } : { name: 'onboarding' };
  }

  // Ofisi olmayan girişli kullanıcı önce onboarding'i tamamlamalı
  // (davet sayfaları hariç — davetle ofise katılabilsin)
  if (
    auth.isRealAuth &&
    !auth.hasOffice &&
    to.name !== 'onboarding' &&
    to.name !== 'invite.preview' &&
    to.name !== 'invite.register' &&
    to.name !== 'invite.accept' &&
    to.name !== 'invite.success'
  ) {
    return { name: 'onboarding' };
  }

  // Ofisi olan kullanıcı onboarding'e gitmeye çalışırsa dashboard'a
  if (auth.isRealAuth && auth.hasOffice && to.name === 'onboarding') {
    return { name: 'dashboard' };
  }

  if (to.meta.adminOnly && !auth.isAdmin) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
