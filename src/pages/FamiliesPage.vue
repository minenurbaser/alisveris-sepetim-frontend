<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { apiClient } from '../api/http';
import { useNotificationStore } from '../store/notifications';
import { RouterLink } from 'vue-router';

interface UserDto { id: string; name: string; email: string }
interface FamilyDto { id: string; name: string; createdBy: UserDto; members: UserDto[] }

const notificationStore = useNotificationStore();
const loading = ref(true);
const creating = ref(false);
const families = ref<FamilyDto[]>([]);

const familyForm = reactive({ name: '' });

const loadFamilies = async () => {
  loading.value = true;
  try {
    const { data } = await apiClient.get<FamilyDto[]>('/families');
    families.value = data ?? [];
  } catch (e) {
    notificationStore.push('error', 'Aileler yüklenemedi');
  } finally {
    loading.value = false;
  }
};

const createFamily = async () => {
  if (!familyForm.name || familyForm.name.trim().length < 3) {
    notificationStore.push('info', 'Aile adı en az 3 karakter olmalıdır');
    return;
  }
  creating.value = true;
  try {
    const { data } = await apiClient.post<FamilyDto>('/families', { name: familyForm.name.trim() });
    families.value.push(data);
    familyForm.name = '';
    notificationStore.push('success', 'Aile oluşturuldu');
  } catch {
    notificationStore.push('error', 'Aile oluşturulamadı');
  } finally {
    creating.value = false;
  }
};

onMounted(loadFamilies);
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">Aile Oluştur</h2>
      <p class="mt-1 text-sm text-slate-500">Ailenizi oluşturun ve üyeleri davet edin.</p>
      <div class="mt-4 grid gap-3 md:grid-cols-[2fr,auto]">
        <input
          v-model="familyForm.name"
          type="text"
          placeholder="Aile adı (örn. Yastıoğlu Ailesi)"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          :disabled="creating"
          @click="createFamily"
        >
          {{ creating ? 'Oluşturuluyor...' : 'Aileyi Oluştur' }}
        </button>
      </div>
    </section>

    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Ailelerim</h2>
      </div>
      <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200">Yükleniyor...</div>
      <div v-else-if="!families.length" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200">Henüz aile yok.</div>
      <div v-else class="grid gap-4 md:grid-cols-2">
        <article v-for="f in families" :key="f.id" class="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm shadow-slate-200">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ f.name }}</h3>
            <p class="mt-1 text-sm text-slate-500">Kurucu: {{ f.createdBy.name }}</p>
            <p class="mt-1 text-sm text-slate-500">Üyeler: {{ f.members.map(m => m.name).join(', ') || '—' }}</p>
          </div>
          <div class="mt-4 flex justify-end">
            <RouterLink :to="{ name: 'family-detail', params: { id: f.id } }" class="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90">
              Üyeleri Yönet
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
