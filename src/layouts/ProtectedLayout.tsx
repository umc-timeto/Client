import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedLayout() {
  const location = useLocation();
  const isAuthenticated = true; // 이후 실제 인증 상태로 교체

  // 비인증: 로그인(서비스 첫 화면: /)으로 보내고, 원래 가려던 경로를 state로 보관
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 이미 인증된 사용자가 로그인 화면(/)로 접근하면 홈으로 보내기
  if (location.pathname === "/") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}