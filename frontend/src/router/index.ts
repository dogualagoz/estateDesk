import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Süper admin paneli — tek bağlantı noktası bu spread (bkz. src/admin/README.md)
import { adminRoutes } from '@/admin/routes';

// Route meta alanlarının tip tanımı — `to.meta.title` gibi erişimler tip güvenli olur
declare module 'vue-router' {
  interface RouteMeta {
    /** Sekme başlığı: "<title> · emlakdefter". Boşsa varsayılan SEO başlığı kullanılır. */
    title?: string;
    /** Auth gerektirmeyen sayfa */
    public?: boolean;
    /** AppShell (sidebar/topbar) gizlenir */
    bare?: boolean;
    /** Demo oturumuyla gezilebilen sayfa */
    demo?: boolean;
    /** Yalnızca ofis admini */
    adminOnly?: boolean;
    /** Yalnızca süper admin (/yonetim paneli) */
    superAdminOnly?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  ...adminRoutes,
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Giriş', public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Kayıt Ol', public: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { title: 'Şifremi Unuttum', public: true },
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'Şifre Sıfırla', public: true },
  },
  {
    path: '/invite/:token',
    name: 'invite.preview',
    component: () => import('@/views/InvitePreviewView.vue'),
    meta: { title: 'Davet', public: true },
  },
  {
    path: '/invite/:token/register',
    name: 'invite.register',
    component: () => import('@/views/InviteRegisterView.vue'),
    meta: { title: 'Davetle Kayıt', public: true },
  },
  {
    path: '/invite/:token/accept',
    name: 'invite.accept',
    component: () => import('@/views/InviteAcceptView.vue'),
    meta: { title: 'Davet', public: true },
  },
  {
    path: '/invite/success',
    name: 'invite.success',
    component: () => import('@/views/InviteSuccessView.vue'),
    meta: { title: 'Davet Tamamlandı', public: true },
  },
  {
    path: '/defter/:token',
    name: 'shared.collection',
    component: () => import('@/views/SharedCollectionView.vue'),
    meta: { title: 'Paylaşılan Defter', public: true },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { title: 'Ofis Kurulumu', bare: true },
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
    meta: { title: 'Panel' },
  },
  // ── Demo: geçici, salt-okunur oturumla aynı ekranlar ──
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Demo', demo: true },
  },
  {
    path: '/demo/portfolio',
    name: 'demo.portfolio',
    component: () => import('@/views/portfolio/PortfolioListView.vue'),
    meta: { title: 'Demo · Portföyler', demo: true },
  },
  {
    path: '/demo/demand',
    name: 'demo.demand',
    component: () => import('@/views/demand/DemandListView.vue'),
    meta: { title: 'Demo · Talepler', demo: true },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
    meta: { title: 'Arama' },
  },
  {
    path: '/portfolio',
    name: 'portfolio.list',
    component: () => import('@/views/portfolio/PortfolioListView.vue'),
    meta: { title: 'Portföyler' },
  },
  {
    path: '/portfolio/new',
    name: 'portfolio.new',
    component: () => import('@/views/portfolio/PortfolioFormView.vue'),
    meta: { title: 'Yeni Portföy' },
  },
  {
    path: '/portfolio/:id',
    name: 'portfolio.detail',
    component: () => import('@/views/portfolio/PortfolioDetailView.vue'),
    meta: { title: 'Portföy' },
  },
  {
    path: '/portfolio/:id/edit',
    name: 'portfolio.edit',
    component: () => import('@/views/portfolio/PortfolioFormView.vue'),
    meta: { title: 'Portföy Düzenle' },
  },
  {
    path: '/demand',
    name: 'demand.list',
    component: () => import('@/views/demand/DemandListView.vue'),
    meta: { title: 'Talepler' },
  },
  {
    path: '/demand/new',
    name: 'demand.new',
    component: () => import('@/views/demand/DemandFormView.vue'),
    meta: { title: 'Yeni Talep' },
  },
  {
    path: '/demand/:id',
    name: 'demand.detail',
    component: () => import('@/views/demand/DemandFormView.vue'),
    meta: { title: 'Talep' },
  },
  {
    path: '/office',
    name: 'office',
    component: () => import('@/views/office/OfficeView.vue'),
    meta: { title: 'Ofisim' },
  },
  {
    path: '/users/:id',
    name: 'profile',
    component: () => import('@/views/users/ProfileView.vue'),
    meta: { title: 'Profil' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { title: 'Kullanıcılar', adminOnly: true },
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

  // ── Süper admin ──
  // Panel dışındakiler /yonetim'e giremez; süper admin ise ofis-kapsamlı
  // ekranlar yerine kendi paneline yönlendirilir (ofisi yoktur).
  if (to.meta.superAdminOnly && !auth.isSuperAdmin) {
    return auth.isRealAuth ? { name: 'dashboard' } : { name: 'login' };
  }
  if (auth.isSuperAdmin && !to.meta.superAdminOnly && !to.meta.public) {
    return { name: 'admin.overview' };
  }

  // Gerçek hesapla girişli kullanıcı landing/login/register'a giderse uygun yere yönlendir
  // (Demo oturumu bunu tetiklemez; demo kullanıcı siteye geri dönebilsin.)
  if (
    auth.isRealAuth &&
    (to.name === 'landing' || to.name === 'login' || to.name === 'register')
  ) {
    if (auth.isSuperAdmin) return { name: 'admin.overview' };
    return auth.hasOffice ? { name: 'dashboard' } : { name: 'onboarding' };
  }

  // Ofisi olmayan girişli kullanıcı önce onboarding'i tamamlamalı
  // (davet sayfaları hariç — davetle ofise katılabilsin; süper admin muaf)
  if (
    auth.isRealAuth &&
    !auth.isSuperAdmin &&
    !auth.hasOffice &&
    to.name !== 'onboarding' &&
    to.name !== 'invite.preview' &&
    to.name !== 'invite.register' &&
    to.name !== 'invite.accept' &&
    to.name !== 'invite.success' &&
    to.name !== 'shared.collection'
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

// ── Dinamik sekme başlığı ──
// Landing gibi title'sız sayfalarda tam SEO başlığı; diğerlerinde "Sayfa · emlakdefter"
const DEFAULT_TITLE = 'emlakdefter — Emlak Ofisleri için Portföy ve Talep Yönetimi';
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · emlakdefter` : DEFAULT_TITLE;
});

export default router;
