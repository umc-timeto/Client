import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/constants/authStore";

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const loginMock = useAuthStore((s) => s.loginMock);

  useEffect(() => {
    const code = params.get("code");
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

    const ctrl = new AbortController();

    fetch(`${baseUrl}/api/auth/kakao/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ authorizationCode: code }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Login failed");
        const data = await res.json();
        if (!data?.isSuccess) throw new Error("Login failed");
        const { memberId, accessToken } = data.result ?? {};
        if (!accessToken) throw new Error("Login failed");

        loginMock({
          user: { id: String(memberId ?? ""), name: "사용자", email: "" },
          accessToken,
        });

        navigate("/home", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });

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