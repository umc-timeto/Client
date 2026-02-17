import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

const DEV_TOKEN = (import.meta.env.VITE_DEV_ACCESS_TOKEN as string | undefined)?.trim();

if (import.meta.env.DEV && DEV_TOKEN) {
  const existing = localStorage.getItem("accessToken");
  if (!existing) localStorage.setItem("accessToken", DEV_TOKEN);
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