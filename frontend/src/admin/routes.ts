import type { RouteRecordRaw } from 'vue-router';

/**
 * Süper admin paneli route'ları. Ana router'a `...adminRoutes` ile eklenir —
 * tek bağlantı noktası budur (bkz. README.md izolasyon sözleşmesi).
 * Tüm bileşenler dynamic import: panel ayrı chunk'ta, ana bundle'ı şişirmez.
 * `/yonetim` hiçbir menüde/sitemap'te geçmez; koruma backend RolesGuard'ındadır.
 */
export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/yonetim',
    component: () => import('./components/AdminLayout.vue'),
    meta: { superAdminOnly: true, bare: true },
    children: [
      {
        path: '',
        name: 'admin.overview',
        component: () => import('./views/AdminOverviewView.vue'),
      },
      {
        path: 'kullanicilar',
        name: 'admin.users',
        component: () => import('./views/AdminUsersView.vue'),
      },
      {
        path: 'ofisler',
        name: 'admin.offices',
        component: () => import('./views/AdminOfficesView.vue'),
      },
      {
        path: 'ofisler/:id',
        name: 'admin.office.detail',
        component: () => import('./views/AdminOfficeDetailView.vue'),
      },
      {
        path: 'loglar',
        name: 'admin.logs',
        component: () => import('./views/AdminLogsView.vue'),
      },
      {
        path: 'analitik',
        name: 'admin.analytics',
        component: () => import('./views/AdminAnalyticsView.vue'),
      },
      {
        path: 'sistem',
        name: 'admin.system',
        component: () => import('./views/AdminSystemView.vue'),
      },
    ],
  },
];
