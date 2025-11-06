<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import NotificationToast from './components/NotificationToast.vue';
import { useAuthStore } from './store/auth';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <NotificationToast />
    <AppHeader v-if="isAuthenticated" />
    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
