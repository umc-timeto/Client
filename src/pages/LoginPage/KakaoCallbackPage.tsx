import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/constants/authStore";

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const loginMock = useAuthStore((s) => s.loginMock);
  const ranRef = useRef(false);
  const lastCodeRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const code = params.get("code");
    console.log("받은 인가코드:", code);

    if (ranRef.current && lastCodeRef.current === code) return;
    ranRef.current = true;
    lastCodeRef.current = code;

    if (!code) {
      if (import.meta.env.DEV) console.log("[kakao] no code in callback");
      navigate("/login", { replace: true });
      return;
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";

    if (!baseUrl) {
      if (import.meta.env.DEV) {
        console.log("[kakao] VITE_API_BASE_URL missing -> mock login");
        console.log("[kakao] code:", code);
      }
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
        if (import.meta.env.DEV) {
          console.log("[kakao] POST /api/auth/kakao/login");
          console.log("[kakao] baseUrl:", baseUrl);
          console.log("[kakao] code:", code);
        }

        const res = await fetch(`${baseUrl}/api/auth/kakao/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ authorizationCode: code }),
          signal: ctrl.signal,
        });

        const raw = await res.text();

        if (import.meta.env.DEV) {
          console.log("[kakao] status:", res.status);
          console.log("[kakao] raw body:", raw);
        }

        if (!res.ok) throw new Error(`Login failed (${res.status})`);

        let data: any;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          data = null;
        }

        if (!data?.isSuccess) throw new Error("Login failed (isSuccess=false)");

        const { memberId, accessToken } = data.result ?? {};
        if (!accessToken) throw new Error("Login failed (no accessToken)");

        loginMock({
          user: { id: String(memberId ?? ""), name: "사용자", email: "" },
          accessToken,
        });

        navigate("/home", { replace: true });
      } catch (err) {
        if (import.meta.env.DEV) console.error("[kakao] login error:", err);
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