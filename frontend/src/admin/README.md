# Süper Admin Paneli (`/yonetim`)

Platform sahibinin (SUPERADMIN) yönetim paneli. PostHog benzeri hafif
analytics + kullanıcı/ofis denetimi + log inceleme.

## İzolasyon Sözleşmesi

Bu klasör, ileride `admin.emlakdefter.com` altında **ayrı bir Vite
uygulamasına çıkarılabilecek** şekilde izole tutulur:

- `src/admin/` yalnızca şunları import edebilir:
  - `@/services/api` (axios instance)
  - `@/stores/auth`
  - `@/composables/useToast`, `@/composables/useConfirm`
  - `@/types/*`
- Ana uygulama admin'den **hiçbir şey import etmez**; tek bağlantı noktası
  `router/index.ts` içindeki `...adminRoutes` spread'idir.
- Admin'e özgü tipler `src/admin/types.ts` içindedir (ana `types/` klasörüne taşınmaz).
- Kendi layout'u vardır (`AdminLayout.vue`) — ana `AppShell` kullanılmaz.

Ayrıştırma günü geldiğinde: klasörü yeni app'e taşı, yukarıdaki dört
bağımlılığı kopyala, `adminRoutes`'u yeni router'ın kökü yap.

## Güvenlik

- Backend: tüm `/admin/*` uçları sınıf seviyesinde `@Roles(SUPERADMIN)`.
- Frontend: route'lar `meta.superAdminOnly` + router guard. Gerçek koruma
  backend'dedir; `/yonetim` path'i menülerde/robots'ta/sitemap'te geçmez.
