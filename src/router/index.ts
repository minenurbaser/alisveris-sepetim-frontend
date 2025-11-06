import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import FamiliesPage from '../pages/FamiliesPage.vue';
import FamilyDetailPage from '../pages/FamilyDetailPage.vue';
import CartDetailPage from '../pages/CartDetailPage.vue';
import ProductsPage from '../pages/ProductsPage.vue';
import { useAuthStore } from '../store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guestOnly: true, title: 'Giriş Yap' },
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsPage,
      meta: { requiresAuth: true, title: 'Ürünler' },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
      meta: { guestOnly: true, title: 'Kayıt Ol' },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true, title: 'Aile Sepetleri' },
    },
    {
      path: '/families',
      name: 'families',
      component: FamiliesPage,
      meta: { requiresAuth: true, title: 'Aileler' },
    },
    {
      path: '/families/:id',
      name: 'family-detail',
      component: FamilyDetailPage,
      meta: { requiresAuth: true, title: 'Aile Detayı' },
    },
    {
      path: '/carts/:id',
      name: 'cart-detail',
      component: CartDetailPage,
      meta: { requiresAuth: true, title: 'Sepet Detayı' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta?.title) {
    document.title = `${to.meta.title} | Family Shopping System`;
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
