/**
 * ConfirmModal
 * 
 * 재사용 가능한 확인(Confirm) 모달 컴포넌트입니다.
 * 
 * - 버튼 라벨은 `cancelText`, `confirmText`로 페이지별로 자유롭게 바꿀 수 있습니다.
 *   (예: "취소/삭제", "취소/탈퇴" 등)
 * - `open`이 false면 아무 것도 렌더링하지 않습니다.
 * - 배경(오버레이) 클릭 시 `onCancel`이 호출됩니다.
 * 
 * 사용 예시
 * 
 * 1) 회원탈퇴 확인
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * <ConfirmModal
 *   open={open}
 *   title="탈퇴하시겠습니까?"
 *   description="계정이 삭제되며 복구되지 않습니다"
 *   cancelText="취소"
 *   confirmText="탈퇴"
 *   onCancel={() => setOpen(false)}
 *   onConfirm={handleWithdraw}
 * />
 * ```
 * 
 * 2) 삭제 확인
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * <ConfirmModal
 *   open={open}
 *   title="목표를 삭제하시겠어요??"
 *   description="목표 내 폴더와 할 일도 삭제돼요"
 *   cancelText="취소"
 *   confirmText="삭제"
 *   onCancel={() => setOpen(false)}
 *   onConfirm={handleDelete}
 * />
 * ```
 */

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  cancelText = "취소",
  confirmText = "확인",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-10.75">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="close modal overlay"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-72.5 rounded-[10px] bg-white pt-6.5 pb-5">
        <div className="title-16-medium text-center text-gray-700">{title}</div>

        {description ? (
          <div className="mt-1.5 body-13-medium text-center text-gray-300">
            {description}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between px-18.25">
          <button
            type="button"
            className="body-13-medium text-gray-700"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="body-13-medium text-red-delete"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}