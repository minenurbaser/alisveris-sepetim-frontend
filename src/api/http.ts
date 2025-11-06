import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

type MaybeRef<T> = T | { value: T };

const unwrap = <T>(value: MaybeRef<T>): T =>
  typeof value === 'object' && value !== null && 'value' in value
    ? (value as { value: T }).value
    : (value as T);

interface AuthBridge {
  accessToken: MaybeRef<string | null>;
  refreshToken: MaybeRef<string | null>;
  refreshSession(): Promise<string>;
  logout(): void;
}

export const setupInterceptors = (authStore: AuthBridge) => {
  apiClient.interceptors.request.use((config) => {
    const token = unwrap(authStore.accessToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let isRefreshing = false;
  let pendingRequests: ((token: string) => void)[] = [];

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response, config } = error;
      if (response?.status === 401 && !config?._retry) {
        const refreshToken = unwrap(authStore.refreshToken);
        if (!refreshToken) {
          authStore.logout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve) => {
            pendingRequests.push((token: string) => {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(config));
            });
          });
        }

        config._retry = true;
        isRefreshing = true;

        try {
          const newToken = await authStore.refreshSession();
          pendingRequests.forEach((callback) => callback(newToken));
          pendingRequests = [];
          config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(config);
        } catch (refreshError) {
          pendingRequests = [];
          authStore.logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );
};
