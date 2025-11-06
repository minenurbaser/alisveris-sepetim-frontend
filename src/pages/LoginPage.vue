<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useNotificationStore } from '../store/notifications';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const form = reactive({
  email: '',
  password: '',
});

const submitting = ref(false);

const handleSubmit = async () => {
  submitting.value = true;
  try {
    await authStore.login(form);
    router.push({ name: 'dashboard' });
  } catch (error: any) {
    const message =
      error?.response?.data?.message || 'Giriş yapılırken bir sorun oluştu';
    notificationStore.push('error', message);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <section class="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
    <div class="rounded-2xl bg-white p-8 shadow-sm shadow-slate-200">
      <h2 class="text-2xl font-semibold text-slate-900">Tekrar Hoş Geldiniz</h2>
      <p class="mt-1 text-sm text-slate-500">
        Ailenizin ortak alışveriş listelerini yönetmek için giriş yapın.
      </p>

      <form class="mt-6 space-y-5" @submit.prevent="handleSubmit">
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700" for="email">E-posta</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700" for="password">Şifre</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          class="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          :disabled="submitting"
        >
          {{ submitting ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Henüz hesabınız yok mu?
        <RouterLink
          class="font-semibold text-primary hover:underline"
          :to="{ name: 'register' }"
        >
          Kayıt Ol
        </RouterLink>
      </p>
    </div>
  </section>
</template>
