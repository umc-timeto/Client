import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppHeaderAuto } from "@/components/Header/index";
import HeaderActionContext from "@/contexts/HeaderActionContext";

export default function ProtectedLayout() {
  const location = useLocation();

  const getCookie = (name: string) => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1")}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  };

  const getAccessToken = () => {
    return (
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      getCookie("accessToken")
    );
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAccessToken()));

  useEffect(() => {
    const sync = () => setIsAuthenticated(Boolean(getAccessToken()));

    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  //Header Action Context: 헤더 "완료/저장" 버튼 동작을 페이지에서 등록할 수 있게 함
  const [onComplete, setOnComplete] = useState<(() => void) | null>(null);

  const headerActionsValue = useMemo(
    () => ({
      onComplete,
      setOnComplete,
    }),
    [onComplete]
  );

  // 비인증: 로그인(서비스 첫 화면: /)으로 보내고, 원래 가려던 경로를 state로 보관
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 이미 인증된 사용자가 로그인 화면(/)로 접근하면 홈으로 보내기
  if (location.pathname === "/") {
    return <Navigate to="/home" replace />;
  }

  return (
    <HeaderActionContext.Provider value={headerActionsValue}>
      <AppHeaderAuto />
      <Outlet />
    </HeaderActionContext.Provider>
  );
}
