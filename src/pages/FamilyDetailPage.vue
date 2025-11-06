<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '../api/http';
import { useNotificationStore } from '../store/notifications';

interface UserDto { id: string; name: string; email: string }
interface FamilyDto { id: string; name: string; createdBy: UserDto; members: UserDto[] }

const route = useRoute();
const notificationStore = useNotificationStore();
const id = computed(() => String(route.params.id));

const loading = ref(true);
const saving = ref(false);
const family = ref<FamilyDto | null>(null);
const invite = reactive({ email: '' });

const load = async () => {
  loading.value = true;
  try {
    const { data } = await apiClient.get<FamilyDto>(`/families/${id.value}`);
    family.value = data;
  } catch {
    notificationStore.push('error', 'Aile bilgisi alınamadı');
  } finally {
    loading.value = false;
  }
};

const addMember = async () => {
  if (!invite.email) return;
  saving.value = true;
  try {
    const { data } = await apiClient.post<FamilyDto>(`/families/${id.value}/members`, { email: invite.email });
    family.value = data;
    invite.email = '';
    notificationStore.push('success', 'Üye eklendi');
  } catch (e) {
    notificationStore.push('error', 'Üye eklenemedi');
  } finally {
    saving.value = false;
  }
};

const removeMember = async (userId: string) => {
  saving.value = true;
  try {
    const { data } = await apiClient.delete<FamilyDto>(`/families/${id.value}/members/${userId}`);
    family.value = data;
    notificationStore.push('success', 'Üye kaldırıldı');
  } catch {
    notificationStore.push('error', 'Üye kaldırılamadı');
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="space-y-8" v-if="!loading && family">
    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">{{ family.name }}</h2>
      <p class="mt-1 text-sm text-slate-500">Kurucu: {{ family.createdBy.name }} ({{ family.createdBy.email }})</p>

      <div class="mt-4 grid gap-3 md:grid-cols-[2fr,auto]">
        <input
          v-model="invite.email"
          type="email"
          placeholder="Üye e-postası"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          :disabled="saving"
          @click="addMember"
        >
          Üye Ekle
        </button>
      </div>
    </section>

    <section>
      <h3 class="mb-3 text-lg font-semibold text-slate-900">Üyeler</h3>
      <div class="rounded-xl bg-white p-4 shadow-sm shadow-slate-200">
        <ul class="divide-y divide-slate-100">
          <li v-for="m in family.members" :key="m.id" class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-slate-800">{{ m.name }}</p>
              <p class="text-sm text-slate-500">{{ m.email }}</p>
            </div>
            <button
              v-if="m.id !== family.createdBy.id"
              class="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              :disabled="saving"
              @click="removeMember(m.id)"
            >
              Kaldır
            </button>
            <span v-else class="text-xs text-slate-400">Kurucu</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
  <div v-else class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200">Yükleniyor...</div>
</template>

