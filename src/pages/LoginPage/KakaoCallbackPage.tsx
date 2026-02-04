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

    // mock 로그인 처리 (백 연동되면 여기만 교체)
    loginMock({
      user: { id: "mock", name: "사용자", email: "" },
      accessToken: `mock_${code}`,
    });

    navigate("/home", { replace: true });
  }, [params, navigate, loginMock]);

  return (
    <div className="min-h-dvh flex items-center justify-center text-gray-300">
      로그인 처리 중...
    </div>
  );
}