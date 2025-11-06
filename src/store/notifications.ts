import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationVariant = 'success' | 'error' | 'info';

export interface NotificationMessage {
  id: number;
  type: NotificationVariant;
  text: string;
}

export const useNotificationStore = defineStore('notifications', () => {
  const messages = ref<NotificationMessage[]>([]);
  let counter = 0;

  const push = (type: NotificationVariant, text: string, timeout = 3000) => {
    const id = ++counter;
    messages.value.push({ id, type, text });
    if (timeout) {
      setTimeout(() => dismiss(id), timeout);
    }
    return id;
  };

  const dismiss = (id: number) => {
    messages.value = messages.value.filter((message) => message.id !== id);
  };

  return { messages, push, dismiss };
});
