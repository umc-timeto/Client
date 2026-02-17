import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/constants/authStore";

type KakaoLoginResponse = {
  status?: number;
  code?: string;
  message?: string;
  data?: {
    memberId?: number | string;
    accessToken?: string;
    refreshToken?: string;
  };
};

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const loginMock = useAuthStore((s) => s.loginMock);

  const ranRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const code = params.get("code");

    if (ranRef.current) return;
    ranRef.current = true;

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";

    if (!baseUrl) {
      loginMock({
        user: { id: "mock", name: "사용자", email: "" },
        accessToken: `mock_${code}`,
      });
      navigate("/home", { replace: true });
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/kakao/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authorizationCode: code }),
          signal: ctrl.signal,
        });

        let payload: KakaoLoginResponse | null = null;
        try {
          payload = (await res.json()) as KakaoLoginResponse;
        } catch {
          payload = null;
        }

        if (!res.ok) throw new Error("Login failed");

        const accessToken = payload?.data?.accessToken ?? "";
        const memberId = payload?.data?.memberId;

        if ((payload?.status ?? 0) !== 200) throw new Error("Login failed");
        if (!accessToken) throw new Error("Login failed");

        loginMock({
          user: { id: String(memberId ?? ""), name: "사용자", email: "" },
          accessToken,
        });

        navigate("/home", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    })();

    return () => {
      ctrl.abort();
    };
  }, [params, navigate, loginMock]);

  return (
    <div className="min-h-dvh flex items-center justify-center text-gray-300">
      로그인 처리 중...
    </div>
  );
}