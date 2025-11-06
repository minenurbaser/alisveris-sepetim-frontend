<script setup lang="ts">
import { computed } from 'vue';
import { useNotificationStore } from '../store/notifications';

const notificationStore = useNotificationStore();

const messages = computed(() => notificationStore.messages);

const variantClasses: Record<string, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-50 flex flex-col space-y-3">
    <TransitionGroup name="toast" tag="div">
      <div
        v-for="message in messages"
        :key="message.id"
        class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg shadow-slate-300/60"
        :class="variantClasses[message.type]"
      >
        <span class="font-medium">{{ message.text }}</span>
        <button
          type="button"
          class="ml-auto text-sm font-semibold opacity-80 transition hover:opacity-100"
          @click="notificationStore.dismiss(message.id)"
        >
          Kapat
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
