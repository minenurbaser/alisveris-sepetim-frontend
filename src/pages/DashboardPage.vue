<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { apiClient } from '../api/http';
import { useCartStore } from '../store/cart';
import { useNotificationStore } from '../store/notifications';

interface FamilyDto {
  id: string;
  name: string;
}

const cartStore = useCartStore();
const notificationStore = useNotificationStore();

const families = ref<FamilyDto[]>([]);
const loading = ref(true);
const creating = ref(false);
const showFamilyForm = ref(false);
const creatingFamily = ref(false);

const form = reactive({
  name: '',
  familyId: '',
});

const familyForm = reactive({
  name: '',
});

const loadData = async () => {
  try {
    const [familiesResponse] = await Promise.all([
      apiClient.get<FamilyDto[]>('/families'),
      cartStore.fetchCarts(),
    ]);
    families.value = familiesResponse.data ?? [];
    const defaultFamily = families.value[0];
    if (!form.familyId && defaultFamily) {
      form.familyId = defaultFamily.id;
    }
    if (!families.value.length) {
      showFamilyForm.value = true;
    }
  } catch (error) {
    notificationStore.push('error', 'Veriler alınırken hata oluştu');
  } finally {
    loading.value = false;
  }
};

const createCart = async () => {
  if (!form.name || !form.familyId) return;
  creating.value = true;
  try {
    await cartStore.createCart({ ...form });
    form.name = '';
  } catch (error) {
    notificationStore.push('error', 'Sepet oluşturulamadı');
  } finally {
    creating.value = false;
  }
};

const createFamily = async () => {
  if (!familyForm.name || familyForm.name.trim().length < 3) {
    notificationStore.push('info', 'Aile adı en az 3 karakter olmalıdır');
    return;
  }
  creatingFamily.value = true;
  try {
    const { data } = await apiClient.post<FamilyDto>('/families', {
      name: familyForm.name.trim(),
    });
    families.value.push(data);
    form.familyId = data.id;
    familyForm.name = '';
    showFamilyForm.value = false;
    notificationStore.push('success', 'Aile oluşturuldu');
  } catch (error) {
    notificationStore.push('error', 'Aile oluşturulamadı');
  } finally {
    creatingFamily.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">Yeni Sepet Oluştur</h2>
      <p class="mt-1 text-sm text-slate-500">
        Aileniz için yeni paylaşımlı bir alışveriş listesi oluşturun.
      </p>

      <form class="mt-4 grid gap-4 md:grid-cols-[2fr,1fr,auto,auto]" @submit.prevent="createCart">
        <input
          v-model="form.name"
          type="text"
          placeholder="Sepet adı (örn. Haftalık Market)"
          required
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          v-model="form.familyId"
          required
          :disabled="!families.length"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>Bir aile seçin</option>
          <option v-for="family in families" :key="family.id" :value="family.id">
            {{ family.name }}
          </option>
        </select>
        <button
          type="submit"
          class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          :disabled="creating"
        >
          {{ creating ? 'Oluşturuluyor...' : 'Sepet Ekle' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="showFamilyForm = !showFamilyForm"
        >
          {{ showFamilyForm ? 'Vazgeç' : 'Yeni Aile' }}
        </button>
      </form>

      <div v-if="showFamilyForm" class="mt-3 grid gap-3 md:grid-cols-[2fr,auto]">
        <input
          v-model="familyForm.name"
          type="text"
          placeholder="Aile adı (örn. Yastıoğlu Ailesi)"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          :disabled="creatingFamily"
          @click="createFamily"
        >
          {{ creatingFamily ? 'Ekleniyor...' : 'Aileyi Oluştur' }}
        </button>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Sepetlerim</h2>
        <p class="text-sm text-slate-500">
          Toplam {{ cartStore.carts.length }} sepet
        </p>
      </div>

      <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200">
        Yükleniyor...
      </div>

      <div v-else-if="cartStore.carts.length === 0" class="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-200">
        Henüz bir sepetiniz yok. Yukarıdan yeni bir sepet oluşturun.
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <article
          v-for="cart in cartStore.carts"
          :key="cart.id"
          class="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm shadow-slate-200"
        >
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ cart.name }}</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ cart.family.name }} • {{ cart.items.length }} ürün
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
            <div>
              <p class="font-medium text-slate-700">Katılımcılar</p>
              <p>
                {{ cart.participants.map((p) => p.name).join(', ') || 'Sadece siz' }}
              </p>
            </div>
            <RouterLink
              class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              :to="{ name: 'cart-detail', params: { id: cart.id } }"
            >
              Görüntüle
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
