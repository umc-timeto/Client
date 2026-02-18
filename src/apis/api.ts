import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";
const DEV_TOKEN = (import.meta.env.VITE_DEV_ACCESS_TOKEN as string | undefined)?.trim();
const DEV_REFRESH_TOKEN = (import.meta.env.VITE_DEV_REFRESH_TOKEN as string | undefined)?.trim();

/**
 * [DEBUG-ONLY]
 * - 개발환경에서만 true
 * - 배포 전에 false로 바꾸거나, 아래 DEBUG 블록 통째 삭제하면 됨
 */
const DEBUG_API = import.meta.env.DEV;

//======================================
// DEV 환경에서 토큰 "최초 1회" 세팅
// - 이미 localStorage에 있으면 덮어쓰지 않음
// - 토큰을 바꿨는데 반영 안 되면 localStorage의 accessToken/refreshToken 지우고 새로고침
//======================================
if (import.meta.env.DEV && DEV_TOKEN) {
  if (!localStorage.getItem("accessToken")) {
    localStorage.setItem("accessToken", DEV_TOKEN);
  }
  if (DEV_REFRESH_TOKEN && !localStorage.getItem("refreshToken")) {
    localStorage.setItem("refreshToken", DEV_REFRESH_TOKEN);
  }
}

//======================================
// axios instance
//======================================
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

//======================================
// util
//======================================
function maskToken(token?: string | null) {
  if (!token) return "(없음)";
  const v = String(token);
  return v.length <= 20 ? `${v.slice(0, 5)}...` : `${v.slice(0, 15)}...`;
}

function getAccessToken() {
  return localStorage.getItem("accessToken") ?? (import.meta.env.DEV ? DEV_TOKEN : null);
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken") ?? (import.meta.env.DEV ? DEV_REFRESH_TOKEN : null);
}

//======================================
// 요청 인터셉터: Authorization 주입 (한 번만!)
//======================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 토큰 없을 때는 Authorization 헤더를 굳이 남기지 않음
      if (config.headers && "Authorization" in config.headers) {
        delete (config.headers as any).Authorization;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

//======================================
// [DEBUG-ONLY] START
// 요청/응답/에러 로깅
//======================================
if (DEBUG_API) {
  api.interceptors.request.use(
    (config) => {
      const method = (config.method ?? "GET").toUpperCase();
      const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
      const token = getAccessToken();

      console.groupCollapsed(`🛰️ [API 요청] ${method} ${url}`);
      console.log("✅ baseURL:", baseURL || "(없음)");
      console.log("✅ withCredentials:", config.withCredentials);
      console.log("✅ accessToken(마스킹):", maskToken(token));
      console.log("✅ 요청 헤더:", config.headers);
      console.log("✅ 요청 바디:", config.data ?? "(없음)");
      console.groupEnd();

      return config;
    },
    (error) => {
      console.error("❌ [API 요청 준비 실패] 요청 인터셉터 에러:", error);
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
      const cfg = error?.config ?? {};
      const method = (cfg.method ?? "GET").toUpperCase();
      const url = `${cfg.baseURL ?? ""}${cfg.url ?? ""}`;
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.groupCollapsed(`❌ [API 에러] ${method} ${url} (${status ?? "상태없음"})`);
      console.log("🧨 AxiosError 메시지:", error?.message);
      console.log("🧾 서버 응답 바디:", data ?? "(없음)");
      console.log("🧩 요청 바디:", cfg.data ?? "(없음)");
      console.log("🧷 요청 헤더:", cfg.headers ?? "(없음)");
      console.groupEnd();

      return Promise.reject(error);
    },
  );
}
//======================================
// [DEBUG-ONLY] END
//======================================

//======================================
// 응답 인터셉터: 401/403이면 refresh 시도 후 1회 재요청
//======================================
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // config 자체가 없으면 재시도 불가
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const isAuthExpired = status === 401 || status === 403;

    const reqUrl = String(originalRequest.url ?? "");
    const isRefreshRequest = reqUrl.includes("/api/auth/refresh");

    // 이미 재시도 했거나, refresh 요청 자체면 여기서 끝
    if (!isAuthExpired || isRefreshRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // refreshToken 없으면 더 못함 → 로그아웃 처리 수준
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return Promise.reject(error);
    }

    try {
      // refresh는 "인터셉터가 안 걸리는" 순수 axios로 호출 (무한루프 방지)
      const refreshRes = await axios.post(
        `${baseURL}/api/auth/refresh`,
        { refreshToken },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      // 백엔드 응답 구조가 data.data.accessToken 형태라고 가정 (팀장님 코드 기준)
      const newAccessToken = (refreshRes.data as any)?.data?.accessToken;
      const newRefreshToken = (refreshRes.data as any)?.data?.refreshToken;

      if (!newAccessToken) {
        // refresh 응답이 왔는데 accessToken이 없으면 실패로 간주
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(error);
      }

      // 새 토큰 저장
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

      // 재요청에 토큰 주입
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // (선택) api 기본 헤더도 갱신
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      // refresh 자체가 실패 → 토큰 제거하고 끝
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return Promise.reject(refreshError);
    }
  },
);
