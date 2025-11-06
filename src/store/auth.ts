import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { apiClient } from '../api/http';
import { useNotificationStore } from './notifications';
import { useCartStore } from './cart';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface Credentials {
  email: string;
  password: string;
}

interface RegisterPayload extends Credentials {
  name: string;
}

const ACCESS_KEY = 'fss_access_token';
const REFRESH_KEY = 'fss_refresh_token';

export const useAuthStore = defineStore('auth', () => {
  const notificationStore = useNotificationStore();
  const accessToken = ref<string | null>(localStorage.getItem(ACCESS_KEY));
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(
    () => !!accessToken.value && !!refreshToken.value && !!user.value,
  );

  const setSession = (payload: AuthResponse) => {
    accessToken.value = payload.accessToken;
    refreshToken.value = payload.refreshToken;
    user.value = payload.user;

    localStorage.setItem(ACCESS_KEY, payload.accessToken);
    localStorage.setItem(REFRESH_KEY, payload.refreshToken);

    const cartStore = useCartStore();
    cartStore.setAuthToken(payload.accessToken);
  };

  const clearSession = () => {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);

    const cartStore = useCartStore();
    cartStore.reset();
  };

  const fetchProfile = async () => {
    const { data } = await apiClient.get<AuthUser>('/users/me');
    user.value = data;
  };

  const login = async (credentials: Credentials) => {
    loading.value = true;
    try {
      const { data } = await apiClient.post<AuthResponse>(
        '/auth/login',
        credentials,
      );
      setSession(data);
      notificationStore.push('success', 'Hoş geldiniz!');
      await fetchProfile();
    } finally {
      loading.value = false;
    }
  };

  const register = async (payload: RegisterPayload) => {
    loading.value = true;
    try {
      const { data } = await apiClient.post<AuthResponse>(
        '/auth/register',
        payload,
      );
      setSession(data);
      notificationStore.push('success', 'Kayıt başarıyla tamamlandı');
      await fetchProfile();
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      if (accessToken.value) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      // ignore logout errors
    } finally {
      clearSession();
    }
  };

  const refreshSession = async (): Promise<string> => {
    if (!refreshToken.value) {
      clearSession();
      throw new Error('Refresh token yok');
    }

    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken: refreshToken.value,
    });

    setSession(data);
    return data.accessToken;
  };

  const initialize = async () => {
    if (initialized.value) return;
    initialized.value = true;

    if (accessToken.value && refreshToken.value) {
      const cartStore = useCartStore();
      cartStore.setAuthToken(accessToken.value);
      try {
        await fetchProfile();
      } catch (error) {
        clearSession();
      }
    } else {
      clearSession();
    }
  };

  return {
    accessToken,
    refreshToken,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshSession,
    initialize,
    fetchProfile,
    setSession,
    clearSession,
  };
});
