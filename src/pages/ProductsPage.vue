<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { apiClient } from '../api/http';
import { useNotificationStore } from '../store/notifications';

interface ProductDto { id: string; name: string; price: number }

const notificationStore = useNotificationStore();
const products = ref<ProductDto[]>([]);
const loading = ref(true);

const form = reactive({ name: '', price: 0 });
const typing = ref('');
const suggestions = ref<ProductDto[]>([]);
let timer: any;

const loadAll = async () => {
  loading.value = true;
  try {
    const { data } = await apiClient.get<ProductDto[]>('/products');
    products.value = data ?? [];
  } finally {
    loading.value = false;
  }
};

const onType = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const q = typing.value.trim();
    if (!q) { suggestions.value = []; return; }
    const { data } = await apiClient.get<ProductDto[]>(`/products/search`, { params: { query: q } });
    suggestions.value = data ?? [];
  }, 200);
};

const normalize = async () => {
  if (!typing.value.trim()) return;
  const { data } = await apiClient.post<{ normalized: string, existing?: ProductDto }>(`/products/normalize`, { name: typing.value });
  form.name = data.normalized;
  if (data.existing) {
    notificationStore.push('info', `Zaten mevcut: ${data.existing.name}`);
  }
};

const addProduct = async () => {
  if (!form.name.trim()) return;
  const { data } = await apiClient.post<ProductDto>(`/products/upsert`, { name: form.name.trim(), price: form.price || 0 });
  notificationStore.push('success', `${data.name} eklendi`);
  form.name = '';
  typing.value = '';
  await loadAll();
};

onMounted(loadAll);
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">Ürün Ekle</h2>
      <p class="mt-1 text-sm text-slate-500">Otomatik düzeltme ve aramayla kolay ürün ekleyin.</p>
      <div class="mt-4 grid gap-3 md:grid-cols-[2fr,auto,auto]">
        <div class="relative">
          <input
            v-model="typing"
            @input="onType"
            type="text"
            placeholder="Ürün adı (örn. Patates)"
            class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div
            v-if="typing && suggestions.length"
            class="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <button
              v-for="s in suggestions"
              :key="s.id"
              type="button"
              class="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
              @click="form.name = s.name; typing = s.name; suggestions = []"
            >
              {{ s.name }} • {{ Number(s.price).toFixed(2) }} ₺
            </button>
          </div>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="normalize"
        >
          Düzelt
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          @click="addProduct"
        >
          Ekle
        </button>
      </div>
    </section>

    <section>
      <h2 class="mb-3 text-lg font-semibold text-slate-900">Ürünler</h2>
      <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200">Yükleniyor...</div>
      <div v-else class="grid gap-3 md:grid-cols-2">
        <div v-for="p in products" :key="p.id" class="rounded-lg bg-white p-4 shadow-sm shadow-slate-200">
          <p class="font-semibold">{{ p.name }}</p>
          <p class="text-sm text-slate-500">{{ Number(p.price).toFixed(2) }} ₺</p>
        </div>
      </div>
    </section>
  </div>
</template>

