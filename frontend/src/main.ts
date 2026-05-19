import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './assets/main.css';

async function bootstrap() {
  const app = createApp(App);
  app.use(createPinia());

  const auth = useAuthStore();
  if (auth.token) {
    await auth.fetchMe();
  }

  app.use(router);
  app.mount('#app');
}

bootstrap();
