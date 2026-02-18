import { useEffect } from "react";

type ConfirmModalVariant = "default" | "danger" | "timeblock" | "timeblockConflict";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  variant?: ConfirmModalVariant;
  cancelClassName?: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  cancelText = "취소",
  confirmText = "확인",
  variant = "default",
  cancelClassName,
  confirmClassName,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const isDanger = variant === "danger";
  const isTimeblockConflict = variant === "timeblockConflict";

  const cancelBtnClass = [
    "text-[13px]",
    "text-gray-dark",
    cancelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const confirmBtnClass = [
    "text-[13px] ",
    isDanger
      ? "text-red-delete"
      : isTimeblockConflict
      ? "text-folder-green-nomal"
      : "",
    confirmClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 z-600 flex items-center justify-center px-10.75">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="close modal overlay"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-72.5 rounded-[10px] bg-white pt-6.5 pb-5">
        <div className="text-[16px] text-center text-gray-700 font-medium">{title}</div>

        {description ? (
          <div className="mt-1.5 text-[13px] text-center text-gray-300 font-medium ">{description}</div>
        ) : null}

        <div className="mt-5 flex items-center justify-between px-18.25 font-medium ">
          <button
            type="button"
            className={cancelBtnClass}
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={confirmBtnClass}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}