
// lib/api/create-api-client.ts
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3700/api/v1";

interface AuthAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string) => void;
  logout: () => void;
  /** Extra headers to attach to every request, e.g. active restaurant id
   *  for the owner portal. Optional. */
  getExtraHeaders?: () => Record<string, string>;
}

interface CreateApiClientOptions {
  /** Path segment appended to API_BASE_URL for the refresh call,
   *  e.g. "/auth/refresh". Pass null if this portal's auth has no refresh
   *  endpoint (e.g. customer-auth) — a 401 will log the user out directly
   *  instead of attempting a refresh call. */
  refreshPath: string | null;
  auth: AuthAdapter;
}

export function createApiClient({ refreshPath, auth }: CreateApiClientOptions) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  }); 

  // Confirmed backend envelope: { success: boolean, data: <payload>, message? }.
  // Unwrap it once here so every function in lib/api/*.ts can just use the
  // real payload directly instead of reaching into response.data.data
  // everywhere.
  client.interceptors.response.use((response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      response.data = body.data;
    }
    return response;
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = auth.getAccessToken();
    if (accessToken) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const extra = auth.getExtraHeaders?.();
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        config.headers.set(key, value);
      });
    }
    return config;
  });

  let isRefreshing = false;
  let pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  function flushQueue(error: unknown, token: string | null) {
    pendingQueue.forEach(({ resolve, reject }) => {
      if (token) resolve(token);
      else reject(error);
    });
    pendingQueue = [];
  }

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | (AxiosRequestConfig & { _retry?: boolean })
        | undefined;

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry
      ) {
        return Promise.reject(error);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken || !refreshPath) {
        auth.logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
              originalRequest._retry = true;
              if (!originalRequest.headers) originalRequest.headers = {};
              (originalRequest.headers as Record<string, string>).Authorization =
                `Bearer ${token}`;
              resolve(client(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}${refreshPath}`, {
          refreshToken,
        });
        const newAccessToken: string = data.accessToken;
        auth.setAccessToken(newAccessToken);
        flushQueue(null, newAccessToken);

        if (!originalRequest.headers) originalRequest.headers = {};
        (originalRequest.headers as Record<string, string>).Authorization =
          `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        auth.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return client;
}

export { API_BASE_URL };
