<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '../api/http';
import { useCartStore } from '../store/cart';
import type { ProductSummary } from '../store/cart';
import { useNotificationStore } from '../store/notifications';

interface ProductDto extends ProductSummary {
  price: number;
}

const route = useRoute();
const cartStore = useCartStore();
const notificationStore = useNotificationStore();

const productQuery = ref('');
const productSuggestions = ref<ProductDto[]>([]);
let searchTimer: any;

const addItemForm = reactive({
  productId: '',
  quantity: 1,
});

const shareSelection = ref<string[]>([]);
const sharing = ref(false);
const addingItem = ref(false);
const suggestions = ref<ProductDto[]>([]);

const cartId = computed(() => {
  const raw = route.params.id;
  if (Array.isArray(raw)) {
    return raw[0] ?? '';
  }
  return raw?.toString() ?? '';
});
const cart = computed(() =>
  cartStore.carts.find((c) => c.id === cartId.value) || null,
);

const familyMembers = computed(() => cart.value?.family.members ?? []);

// Dropdown'u kaldırdığımız için ürün listesi çekmiyoruz

const searchProducts = async () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = productQuery.value.trim();
    if (!q) { productSuggestions.value = []; return; }
    const { data } = await apiClient.get<ProductDto[]>('/products/search', { params: { query: q } });
    productSuggestions.value = data ?? [];
  }, 200);
};

const ensureCartLoaded = async () => {
  if (!cartId.value) return;
  if (!cart.value) {
    await cartStore.fetchCarts();
  }
  cartStore.joinCart(cartId.value);
};

const loadSuggestions = async () => {
  if (!cart.value) return;
  // Backend artık sepet id üzerinden öneri veriyor
  const { data } = await apiClient.get<ProductDto[]>(`/carts/${cart.value.id}/suggestions`);
  suggestions.value = data ?? [];
};

const handleAddItem = async () => {
  if ((!addItemForm.productId && !productQuery.value.trim()) || addItemForm.quantity < 1) {
    notificationStore.push('error', 'Lütfen geçerli bir ürün ve miktar seçin');
    return;
  }
  addingItem.value = true;
  try {
    const payload: any = { quantity: addItemForm.quantity };
    if (addItemForm.productId) {
      payload.productId = addItemForm.productId;
    } else {
      payload.name = productQuery.value.trim();
    }
    await cartStore.addItem(cartId.value, payload);
    addItemForm.quantity = 1;
    productQuery.value = '';
    productSuggestions.value = [];
  } catch (error) {
    notificationStore.push('error', 'Ürün sepete eklenemedi');
  } finally {
    addingItem.value = false;
  }
};

const handleShare = async () => {
  sharing.value = true;
  try {
    await cartStore.shareCart(cartId.value, [...shareSelection.value]);
  } catch (error) {
    notificationStore.push('error', 'Sepet paylaşımı başarısız oldu');
  } finally {
    sharing.value = false;
  }
};

// Price modal state
const priceModalOpen = ref(false);
const priceModalSubmitting = ref(false);
const priceModalValue = ref<string>('');
const priceModalItem = ref<any | null>(null);

const openPriceModal = (item: any) => {
  priceModalItem.value = item;
  const current = Number(item.product.price);
  priceModalValue.value = isNaN(current) ? '' : String(current);
  priceModalOpen.value = true;
};

const cancelPriceModal = () => {
  priceModalOpen.value = false;
  priceModalItem.value = null;
  priceModalValue.value = '';
};

const confirmPriceModal = async () => {
  if (!priceModalItem.value) return;
  priceModalSubmitting.value = true;
  try {
    const raw = String(priceModalValue.value || '').trim();
    const hasPrice = raw !== '' && !isNaN(Number(raw)) && Number(raw) >= 0;
    const payload: { purchased: boolean; price?: number } = { purchased: true };
    if (hasPrice) payload.price = Number(raw);
    
    console.log('confirmPriceModal - cartId:', cartId.value);
    console.log('confirmPriceModal - itemId:', priceModalItem.value.id);
    console.log('confirmPriceModal - payload:', payload);
    
    await cartStore.updateItem(cartId.value, priceModalItem.value.id, payload);
    cancelPriceModal();
  } catch (e) {
    console.error('confirmPriceModal error:', e);
    notificationStore.push('error', 'Güncelleme başarısız');
  } finally {
    priceModalSubmitting.value = false;
  }
};

const onTogglePurchased = async (item: any, evt: Event) => {
  try {
    const newState = !item.purchased;
    if (newState) {
      // Prevent immediate toggle; open modal
      const target = evt.target as HTMLInputElement;
      if (target) target.checked = !!item.purchased;
      openPriceModal(item);
      return;
    }
    await cartStore.updateItem(cartId.value, item.id, { purchased: false });
  } catch (e) {
    notificationStore.push('error', 'Güncelleme başarısız');
  }
};

watch(cart, (next) => {
  if (next) {
    shareSelection.value = next.participants.map((participant) => participant.id);
    loadSuggestions();
  }
});

watch(
  () => cartId.value,
  async () => {
    if (cartId.value) {
      await ensureCartLoaded();
    }
  },
  { immediate: true },
);

onMounted(() => {
  loadSuggestions();
});

const totalCost = computed(() => {
  if (!cart.value) return 0;
  return cart.value.items.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.price),
    0,
  );
});
</script>

<template>
  <div v-if="!cart" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200">
    Sepet yükleniyor...
  </div>
  <div v-else class="space-y-6">
    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">{{ cart.name }}</h1>
          <p class="text-sm text-slate-500">{{ cart.family.name }} • {{ cart.items.length }} ürün</p>
        </div>
        <div class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Toplam: {{ totalCost.toFixed(2) }} ₺
        </div>
      </header>

      <div class="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Sepetteki Ürünler</h2>
          <div v-if="cart.items.length === 0" class="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Henüz ürün eklenmemiş. Hemen başlamak için aşağıdaki formu kullanın.
          </div>
          <ul v-else class="space-y-4">
            <li
              v-for="item in cart.items"
              :key="item.id"
              class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
            >
              <div>
                <p class="font-semibold text-slate-900">
                  <span :class="item.purchased ? 'line-through text-slate-500' : ''">{{ item.product.name }}</span>
                  <span v-if="item.purchased" class="ml-2 rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">Alındı</span>
                </p>
                <p class="text-sm text-slate-500">
                  {{ item.quantity }} adet • {{ Number(item.product.price).toFixed(2) }} ₺
                </p>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" :checked="!!item.purchased" @change="onTogglePurchased(item, $event)" />
                  Alındı
                </label>
                <p class="text-sm font-semibold text-slate-700">
                  {{ (item.quantity * Number(item.product.price)).toFixed(2) }} ₺
                </p>
                <button
                  type="button"
                  class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  @click="cartStore.removeItem(cart.id, item.id)"
                >
                  Sil
                </button>
              </div>
            </li>
          </ul>
        </div>

        <form class="space-y-4 rounded-xl border border-slate-200 p-5" @submit.prevent="handleAddItem">
          <h3 class="text-base font-semibold text-slate-900">Ürün Ekle</h3>
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-600">Ürün</label>
            <div class="relative">
              <input
                v-model="productQuery"
                @input="searchProducts"
                type="text"
                placeholder="Ürün adı yazın veya alttan seçin"
                class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div v-if="productQuery && productSuggestions.length" class="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-sm">
                <button
                  v-for="s in productSuggestions"
                  :key="s.id"
                  type="button"
                  class="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                  @click="addItemForm.productId = s.id; productQuery = s.name; productSuggestions = []"
                >
                  {{ s.name }} • {{ Number(s.price).toFixed(2) }} ₺
                </button>
              </div>
            </div>
            <div class="text-xs text-slate-500">Mevcut listeden seçim yapabilir ya da yeni ürün yazıp ekleyebilirsiniz.</div>
            <!-- Dropdown kaldırıldı: sadece yazdıkça tamamlama ve serbest yazı -->
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-600">Miktar</label>
            <input
              v-model.number="addItemForm.quantity"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            :disabled="addingItem"
          >
            {{ addingItem ? 'Ekleniyor...' : 'Sepete Ekle' }}
          </button>
        </form>
      </div>
    </section>

    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">Önerilen Ürünler</h2>
      <p class="text-sm text-slate-500">Sepet adı ve mevcut ürünlere göre öneriler.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="s in suggestions"
          :key="s.id"
          type="button"
          class="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          @click="addItemForm.productId = s.id; productQuery = s.name; handleAddItem()"
        >
          + {{ s.name }}
        </button>
        <span v-if="!suggestions.length" class="text-sm text-slate-500">Şu an öneri yok.</span>
      </div>
    </section>

    <section class="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">Paylaşım Ayarları</h2>
      <p class="text-sm text-slate-500">
        Ailenizden kimlerin bu sepeti görebileceğini yönetin.
      </p>

      <div class="mt-4 space-y-4">
        <div v-if="familyMembers.length === 0" class="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Bu sepetin bağlı olduğu aile henüz üye içermiyor.
        </div>
        <div v-else class="grid gap-3 md:grid-cols-2">
          <label
            v-for="member in familyMembers"
            :key="member.id"
            class="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"
          >
            <input
              v-model="shareSelection"
              type="checkbox"
              :value="member.id"
              class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <p class="font-semibold text-slate-800">{{ member.name }}</p>
              <p class="text-xs text-slate-500">{{ member.email }}</p>
            </div>
          </label>
        </div>

        <button
          type="button"
          class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          :disabled="sharing"
          @click="handleShare"
        >
          {{ sharing ? 'Paylaşılıyor...' : 'Paylaşımı Güncelle' }}
        </button>
      </div>
    </section>
    <div v-if="priceModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 class="text-base font-semibold text-slate-900">Birim fiyatı gir</h3>
        <p class="mt-1 text-sm text-slate-500">Boş bırakırsanız mevcut fiyat korunur.</p>
        <div class="mt-4">
          <label class="text-xs font-medium text-slate-600">Fiyat (₺)</label>
          <input
            v-model="priceModalValue"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Örn. 15.90"
          />
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            @click="cancelPriceModal()"
          >
            Vazgeç
          </button>
          <button
            type="button"
            class="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            :disabled="priceModalSubmitting"
            @click="confirmPriceModal()"
          >
            {{ priceModalSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
