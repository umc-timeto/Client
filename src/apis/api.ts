import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

const DEV_TOKEN = (import.meta.env.VITE_DEV_ACCESS_TOKEN as string | undefined)?.trim();
const DEV_REFRESH_TOKEN = (import.meta.env.VITE_DEV_REFRESH_TOKEN as string | undefined)?.trim();

if (import.meta.env.DEV && DEV_TOKEN) {
  if (!localStorage.getItem("accessToken")) {
    localStorage.setItem("accessToken", DEV_TOKEN);
  }

  if (DEV_REFRESH_TOKEN && !localStorage.getItem("refreshToken")) {
    localStorage.setItem("refreshToken", DEV_REFRESH_TOKEN);
  }
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") ?? (import.meta.env.DEV ? DEV_TOKEN : null);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isAuthExpired = status === 401 || status === 403;

    const reqUrl = String(originalRequest.url ?? "");
    const isRefreshRequest = reqUrl.includes("/api/auth/refresh");

    if (isAuthExpired && !isRefreshRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${baseURL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = res.data?.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);