import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div>
      {/* 나브바 들어갈 예정 */}
      <Outlet />
    </div>
  );
}