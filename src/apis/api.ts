import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const DEV_TOKEN = (import.meta.env.VITE_DEV_ACCESS_TOKEN as string | undefined)?.trim();

/**
 * [DEBUG-ONLY] 개발 중에만 켜는 API 디버그 로그 플래그
 * - 배포 전에 false로 바꾸거나
 * - 아래 [DEBUG-ONLY] START ~ END 블록을 통째로 삭제하면 됨
 */
const DEBUG_API = import.meta.env.DEV;

/**
 * 개발환경에서 DEV_TOKEN이 있으면 localStorage에 accessToken을 "최초 1회" 자동 세팅
 * - 이미 accessToken이 있으면 덮어쓰지 않음
 * - 토큰을 바꿨는데 반영이 안 되면 localStorage의 accessToken을 지우고 새로고침
 */
if (import.meta.env.DEV && DEV_TOKEN) {
  const existing = localStorage.getItem("accessToken");
  if (!existing) localStorage.setItem("accessToken", DEV_TOKEN);

  // [DEBUG-ONLY] START
  if (DEBUG_API) {
    const now = localStorage.getItem("accessToken");
    const masked = now ? `${now.slice(0, 15)}...` : "(없음)";
    console.log("[API][개발토큰] accessToken 자동 세팅 상태:", masked);
  }
  // [DEBUG-ONLY] END
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
