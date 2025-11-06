import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import router from './router';
import { setupInterceptors } from './api/http';
import { useAuthStore } from './store/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const authStore = useAuthStore();
setupInterceptors(authStore);

await authStore.initialize();

app.use(router);
app.mount('#app');
