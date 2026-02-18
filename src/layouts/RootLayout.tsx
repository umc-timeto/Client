import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import ConfirmModal from "@/components/ConfirmModal";

import { withdrawApi } from "@/apis/auth/withdrawApi";
import { useAuthStore } from "@/constants/authStore";

type RootOutletContext = {
  openDrawer: () => void;
};

export default function RootLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const onNavigate = (to: string) => {
    navigate(to);
    closeDrawer();
  };

  const onLogout = () => {
    closeDrawer();
    navigate("/");
  };

  const onOpenWithdraw = () => {
    setIsWithdrawModalOpen(true);
  };

  const onCloseWithdraw = () => {
    setIsWithdrawModalOpen(false);
  };

  const onConfirmWithdraw = async () => {
    try {
      await withdrawApi.withdraw();
      logout(); 
      setIsWithdrawModalOpen(false);
      closeDrawer();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      setIsWithdrawModalOpen(false);
    }
  };

  const outletContext = useMemo<RootOutletContext>(() => ({ openDrawer }), []);

  return (
    <div className="min-h-dvh bg-white">
      <Navbar
        open={isDrawerOpen}
        onClose={closeDrawer}
        userName={user?.name}
        userEmail={user?.email}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onWithdraw={onOpenWithdraw}
      />

      <ConfirmModal
        open={isWithdrawModalOpen}
        title="탈퇴하시겠습니까?"
        description="계정이 삭제되며 복구되지 않습니다"
        cancelText="취소"
        confirmText="탈퇴"
        variant="danger"
        onCancel={onCloseWithdraw}
        onConfirm={onConfirmWithdraw}
      />

      <Outlet context={outletContext} />
    </div>
  );
}