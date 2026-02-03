import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Navbar from "@/components/Navbar";
import ConfirmModal from "@/components/ConfirmModal";

type RootOutletContext = {
  openDrawer: () => void;
};

export default function RootLayout() {
  const navigate = useNavigate();

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

  const onConfirmWithdraw = () => {
    setIsWithdrawModalOpen(false);
    closeDrawer();
    navigate("/");
  };

  const outletContext = useMemo<RootOutletContext>(() => ({ openDrawer }), []);

  return (
    <div className="min-h-dvh bg-white">
      <Navbar
        open={isDrawerOpen}
        onClose={closeDrawer}
        userName={undefined}
        userEmail={undefined}
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
        onCancel={onCloseWithdraw}
        onConfirm={onConfirmWithdraw}
      />

      <Outlet context={outletContext} />
    </div>
  );
}