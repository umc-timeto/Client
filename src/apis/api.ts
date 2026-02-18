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

/**
 * 토큰 문자열을 콘솔에 찍을 때 너무 길면 위험/지저분해서 앞부분만 마스킹
 */
function maskToken(token: string) {
  if (!token) return "(없음)";
  if (token.length <= 20) return `${token.slice(0, 5)}...`;
  return `${token.slice(0, 15)}...`;
}

//========================
// [DEBUG-ONLY] START
// 요청/응답/에러 로깅 (배포 전에 삭제하기 쉽게 블록으로 분리)
//========================
if (DEBUG_API) {
  api.interceptors.request.use(
    (config) => {
      const method = (config.method ?? "GET").toUpperCase();
      const url = `${config.baseURL ?? ""}${config.url ?? ""}`;

      const token =
        localStorage.getItem("accessToken") ?? (import.meta.env.DEV ? DEV_TOKEN : null);

      console.groupCollapsed(`🛰️ [API 요청] ${method} ${url}`);
      console.log("✅ baseURL:", baseURL || "(없음)");
      console.log("✅ withCredentials:", config.withCredentials);
      console.log("✅ 토큰(마스킹):", token ? maskToken(token) : "(없음)");
      console.log("✅ 헤더:", config.headers);
      console.log("✅ 바디:", config.data ?? "(없음)");
      console.groupEnd();

      return config;
    },
    (error) => {
      console.error("❌ [API 요청 준비 실패] 요청 인터셉터에서 에러 발생:", error);
      return Promise.reject(error);
    },
  );

  api.interceptors.response.use(
    (res) => {
      const method = (res.config.method ?? "GET").toUpperCase();
      const url = `${res.config.baseURL ?? ""}${res.config.url ?? ""}`;

      console.groupCollapsed(`✅ [API 응답] ${method} ${url} (${res.status})`);
      console.log("📦 응답 데이터:", res.data);
      console.log("📌 응답 헤더:", res.headers);
      console.groupEnd();

      return res;
    },
    (error) => {
      const config = error?.config ?? {};
      const method = (config.method ?? "GET").toUpperCase();
      const url = `${config.baseURL ?? ""}${config.url ?? ""}`;

      const status = error?.response?.status;
      const data = error?.response?.data;

      console.groupCollapsed(`❌ [API 에러] ${method} ${url} (${status ?? "상태없음"})`);
      console.log("🧨 AxiosError 메시지:", error?.message);
      console.log("🧾 서버 응답 바디:", data ?? "(없음)");
      console.log("🧩 요청 바디:", config.data ?? "(없음)");
      console.log("🧷 요청 헤더:", config.headers ?? "(없음)");
      console.groupEnd();

      return Promise.reject(error);
    },
  );
}
//========================
// [DEBUG-ONLY] END
//========================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") ?? (import.meta.env.DEV ? DEV_TOKEN : null);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
//

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