<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <header class="bg-white shadow-sm">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-semibold">
          FS
        </div>
        <div>
          <h1 class="text-lg font-semibold text-slate-900">Family Shopping System</h1>
          <p class="text-sm text-slate-500">Gerçek zamanlı aile alışveriş yönetimi</p>
        </div>
      </div>
      <nav class="flex items-center gap-4">
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Sepetler
        </RouterLink>
        <RouterLink
          :to="{ name: 'families' }"
          class="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Aileler
        </RouterLink>
        <RouterLink
          :to="{ name: 'products' }"
          class="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Ürünler
        </RouterLink>
      </nav>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm font-medium text-slate-900">{{ user?.name }}</p>
          <p class="text-xs text-slate-500">{{ user?.email }}</p>
        </div>
        <button
          type="button"
          class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          @click="handleLogout"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  </header>
</template>
