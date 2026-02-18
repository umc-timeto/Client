import CloseIcon from "@/assets/close.svg";

type NavbarProps = {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  onWithdraw: () => void;
};

export default function Navbar({
  open,
  onClose,
  userName,
  userEmail,
  onNavigate,
  onLogout,
  onWithdraw,
}: NavbarProps) {
  if (!open) return null;

  const displayName = userName && userName.trim().length > 0 ? userName : "사용자";
  const displayEmail = userEmail && userEmail.trim().length > 0 ? userEmail : "email@example.com";

  return (
    <div className="fixed inset-0 z-500 flex flex-col bg-white">
      <header className="flex items-center justify-end px-5 pt-17.5">
        <button
          type="button"
          aria-label="close menu"
          onClick={onClose}
        >
          <img
            src={CloseIcon}
            alt="닫기"
            className="h-7 w-7"
          />
        </button>
      </header>

      <main className="flex-1 px-5 pb-0 flex flex-col">
        <section className="pt-8">
          <div className="title-20-semibold text-gray-700">{displayName}</div>
          <div className="mt-2 text-[14px] text-gray-300">{displayEmail}</div>
        </section>

        <nav className="mt-[40.5px] flex flex-col gap-5">
          <button
            type="button"
            className="text-[16px] text-left text-gray-700"
            onClick={() => onNavigate("/home")}
          >
            내 목표
          </button>

          <div className="border-t border-gray-200" />

          <button
            type="button"
            className="text-[16px] text-left text-gray-700"
            onClick={() => onNavigate("/timeblock")}
          >
            타임 블록
          </button>

          <div className="border-t border-gray-200" />

          <button
            type="button"
            className="text-[16px] text-left text-gray-700"
            onClick={() => onNavigate("/mylog")}
          >
            내 일지
          </button>
        </nav>

        <div className="mt-auto pb-12.5 flex flex-col gap-3.5">
          <button
            type="button"
            className="text-[14px] text-left text-gray-700"
            onClick={onLogout}
          >
            로그아웃
          </button>
          <button
            type="button"
            className="text-[14px] text-left text-red-delete"
            onClick={onWithdraw}
          >
            회원탈퇴
          </button>
        </div>
      </main>
    </div>
  );
}