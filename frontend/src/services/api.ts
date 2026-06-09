import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 30_000,
});

export const DEMO_TOKEN_KEY = 'ed_demo_token';

api.interceptors.request.use((config) => {
  // Gerçek oturum yoksa geçici demo oturumunun token'ını kullan
  const token = localStorage.getItem('ed_token') || sessionStorage.getItem(DEMO_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const onDemo = window.location.pathname.startsWith('/demo');
      if (onDemo) {
        // Demo oturumu düştü → siteye dön, login'e zorlama
        sessionStorage.removeItem(DEMO_TOKEN_KEY);
        window.location.href = '/';
      } else {
        localStorage.removeItem('ed_token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  },
);
