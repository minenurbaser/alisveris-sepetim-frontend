import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../api/http';
import { useNotificationStore } from './notifications';

export interface ProductSummary {
  id: string;
  name: string;
  price: number | string;
}

export interface CartItemDto {
  id: string;
  quantity: number;
  purchased?: boolean;
  product: ProductSummary;
}

export interface CartDto {
  id: string;
  name: string;
  family: { id: string; name: string; members?: Array<{ id: string; name: string; email: string }> };
  createdBy: { id: string; name: string; email: string };
  items: CartItemDto[];
  participants: Array<{ id: string; name: string; email: string; role?: string }>;
  createdAt: string;
  updatedAt: string;
}

interface CreateCartPayload {
  name: string;
  familyId: string;
}

interface AddCartItemPayload {
  productId?: string;
  name?: string;
  quantity: number;
}

export const useCartStore = defineStore('carts', () => {
  const notificationStore = useNotificationStore();
  const carts = ref<CartDto[]>([]);
  const activeCartId = ref<string | null>(null);
  const socket = ref<Socket | null>(null);
  const connecting = ref(false);
  const authToken = ref<string | null>(null);

  const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

  const activeCart = computed(() =>
    carts.value.find((cart) => cart.id === activeCartId.value) ?? null,
  );

  const ensureSocket = () => {
    if (!authToken.value) {
      return;
    }

    if (socket.value?.connected) {
      return;
    }

    socket.value?.disconnect();
    connecting.value = true;

    socket.value = io(`${wsUrl}/carts`, {
      transports: ['websocket', 'polling'],
      auth: {
        token: `Bearer ${authToken.value}`,
      },
    });

    socket.value.on('connect', () => {
      connecting.value = false;
      if (activeCartId.value) {
        socket.value?.emit('joinCart', { cartId: activeCartId.value });
      }
    });

    socket.value.on('cart:update', (cart: CartDto) => {
      replaceCart(cart);
      notificationStore.push('info', `${cart.name} güncellendi`);
    });

    socket.value.on('cart:refresh', (cart: CartDto) => {
      replaceCart(cart);
    });

    socket.value.on('disconnect', () => {
      connecting.value = false;
    });
  };

  const replaceCart = (cart: CartDto) => {
    const index = carts.value.findIndex((item) => item.id === cart.id);
    if (index === -1) {
      carts.value.push(cart);
    } else {
      carts.value[index] = cart;
    }
  };

  const fetchCarts = async () => {
    const { data } = await apiClient.get<CartDto[]>('/carts');
    carts.value = data;
    const firstCart = data[0];
    if (!activeCartId.value && firstCart) {
      activeCartId.value = firstCart.id;
    }
    ensureSocket();
    if (activeCartId.value) {
      joinCart(activeCartId.value);
    }
  };

  const createCart = async (payload: CreateCartPayload) => {
    const { data } = await apiClient.post<CartDto>('/carts', payload);
    replaceCart(data);
    activeCartId.value = data.id;
    ensureSocket();
    joinCart(data.id);
    notificationStore.push('success', 'Yeni sepet oluşturuldu');
    return data;
  };

  const shareCart = async (cartId: string, userIds: string[]) => {
    const { data } = await apiClient.put<CartDto>(`/carts/${cartId}/share`, {
      userIds,
    });
    replaceCart(data);
    notificationStore.push('success', 'Sepet paylaşıldı');
    return data;
  };

  const addItem = async (cartId: string, payload: AddCartItemPayload) => {
    const { data } = await apiClient.post<CartDto>(
      `/carts/${cartId}/items`,
      payload,
    );
    replaceCart(data);
    notificationStore.push('success', 'Ürün sepete eklendi');
    return data;
  };


  const removeItem = async (cartId: string, itemId: string) => {
    const { data } = await apiClient.delete<CartDto>(
      `/carts/${cartId}/items/${itemId}`
    );
    replaceCart(data);
    notificationStore.push('info', 'Ürün sepetten kaldırıldı');
    return data;
  };
  const updateItem = async (
    cartId: string,
    itemId: string,
    payload: { purchased?: boolean; price?: number },
  ) => {
    try {
      const { data } = await apiClient.patch<CartDto>(
        `/carts/${cartId}/items/${itemId}`,
        payload,
      );
      replaceCart(data);
      notificationStore.push('success', 'Ürün güncellendi');
      return data;
    } catch (err: any) {
      console.error('updateItem failed:', err);
      notificationStore.push('error', 'Güncelleme başarısız');
      throw err;
    }
  };
  const joinCart = (cartId: string) => {
    activeCartId.value = cartId;
    ensureSocket();
    socket.value?.emit('joinCart', { cartId });
  };

  const reset = () => {
    carts.value = [];
    activeCartId.value = null;
    socket.value?.disconnect();
    socket.value = null;
    authToken.value = null;
  };

  const setAuthToken = (token: string | null) => {
    authToken.value = token;
    if (!token) {
      reset();
      return;
    }
    ensureSocket();
    if (activeCartId.value) {
      joinCart(activeCartId.value);
    }
  };

  return {
    carts,
    activeCartId,
    activeCart,
    connecting,
    setAuthToken,
    fetchCarts,
    createCart,
    shareCart,
    addItem,
    updateItem,
    removeItem,
    joinCart,
    reset,
  };
});
