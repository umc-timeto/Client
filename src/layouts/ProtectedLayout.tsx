import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  const isAuthenticated = true; // 이후 실제 인증 상태로 교체

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}