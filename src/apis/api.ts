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

/* =========================
 * [DEBUG-ONLY] START
 * - 여기부터 아래 END까지가 "디버깅 코드"
 * - 배포/PR 정리할 때 이 블록만 통째로 삭제하면 됨
 * ========================= */

const DEBUG_API = import.meta.env.DEV;

/** 토큰은 콘솔에 그대로 찍으면 위험/지저분해서 앞부분만 마스킹 */
function maskToken(token: string | null | undefined) {
  if (!token) return "(없음)";
  return token.length <= 20 ? `${token.slice(0, 5)}...` : `${token.slice(0, 15)}...`;
}


/**
 * [요청 로그]
 * - 실제 요청이 나가기 직전에 method/url/header/body를 찍음
 * - Authorization이 제대로 붙었는지 확인용
 */
if (DEBUG_API) {
  api.interceptors.request.use(
    (config) => {
      const method = (config.method ?? "GET").toUpperCase();
      const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
      const token = localStorage.getItem("accessToken") ?? (import.meta.env.DEV ? DEV_TOKEN : null);

      console.groupCollapsed(`[API 요청] ${method} ${url}`);
      console.log("baseURL:", baseURL || "(없음)");
      console.log("withCredentials:", config.withCredentials);
      console.log("accessToken(마스킹):", maskToken(token));
      console.log("요청 헤더:", config.headers);
      console.log("요청 바디:", config.data ?? "(없음)");
      console.groupEnd();

      return config;
    },
    (e) => Promise.reject(e)
  );

  /**
   * [응답/에러 로그]
   * - 응답 성공: status + data
   * - 에러: status + 서버 바디 + 요청 바디/헤더
   * - 401/403이면 토큰 문제 or refresh 문제 바로 추적 가능
   */
  api.interceptors.response.use(
    (res) => {
      const method = (res.config.method ?? "GET").toUpperCase();
      const url = `${res.config.baseURL ?? ""}${res.config.url ?? ""}`;

      console.groupCollapsed(`[API 응답] ${method} ${url} (${res.status})`);
      console.log("응답 데이터:", res.data);
      console.groupEnd();

      return res;
    },
    (error) => {
      const cfg = error?.config ?? {};
      const method = (cfg.method ?? "GET").toUpperCase();
      const url = `${cfg.baseURL ?? ""}${cfg.url ?? ""}`;
      const status = error?.response?.status;

      console.groupCollapsed(`[API 에러] ${method} ${url} (${status ?? "상태없음"})`);
      console.log("에러 메시지:", error?.message);
      console.log("서버 응답 바디:", error?.response?.data ?? "(없음)");
      console.log("요청 바디:", cfg.data ?? "(없음)");
      console.log("요청 헤더:", cfg.headers ?? "(없음)");
      console.groupEnd();

      return Promise.reject(error);
    }
  );
}

/* =========================
 * [DEBUG-ONLY] END
 * ========================= */
