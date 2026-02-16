/**
 * ActionMenu
 *
 * 목표 / 폴더 / 할 일 등에서 공통으로 사용하는
 * "수정하기 / 삭제하기" 액션 드롭다운 메뉴 컴포넌트입니다.
 *
 * - `open`이 false면 아무 것도 렌더링하지 않습니다.
 * - 메뉴 바깥 영역을 클릭하면 자동으로 닫힙니다.
 * - 각 버튼 클릭 시:
 *    1) 먼저 onClose()로 메뉴를 닫고
 *    2) 이후 onEdit() 또는 onDelete()를 실행합니다.
 *
 * - 라벨은 `editLabel`, `deleteLabel`로 페이지별 커스터마이징 가능합니다.
 *   (예: "수정하기/삭제하기", "이름 변경/제거" 등)
 *
 * - 아이콘은 `EditIcon`, `DeleteIcon`으로 외부에서 주입받습니다.
 *   (페이지별로 다른 아이콘 사용 가능)
 *
 * - `className`을 통해 위치(top/right 등) 커스터마이징이 가능합니다.
 *
 * 사용 예시
 *
 * 1) 목표 페이지
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <ActionMenu
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onEdit={handleEditGoal}
 *   onDelete={handleDeleteGoal}
 *   EditIcon={<EditSvg className="h-4 w-4" />}
 *   DeleteIcon={<DeleteSvg className="h-4 w-4" />}
 * />
 * ```
 *
 * 2) 폴더 페이지
 * ```tsx
 * <ActionMenu
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onEdit={handleEditFolder}
 *   onDelete={handleDeleteFolder}
 * />
 * ```
 */
import { useEffect, useRef } from "react";

type ActionMenuProps = {
  open: boolean;
  onClose: () => void;

  onEdit: () => void;
  onDelete: () => void;

  editLabel?: string;   //기본: 수정하기
  deleteLabel?: string; //기본: 삭제하기

  EditIcon?: React.ReactNode;
  DeleteIcon?: React.ReactNode;

  className?: string;   //포지션 커스텀 필요하면
};

export default function ActionMenu({
  open,
  onClose,
  onEdit,
  onDelete,
  editLabel = "수정하기",
  deleteLabel = "삭제하기",
  EditIcon,
  DeleteIcon,
  className,
}: ActionMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  //바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current) return;
      if (ref.current.contains(t)) return;
      onClose();
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={[
        "absolute right-0 top-8 z-50 overflow-hidden rounded-[10px] bg-white shadow-lg",
        className ?? "",
      ].join(" ")}
    >
      <button
        type="button"
        className={[
          "flex w-32.75 h-13 items-center justify-between px-5 py-3",
          "text-grey-dark body-14-medium",
          "hover:bg-grey-light active:bg-grey-light-hover",
        ].join(" ")}
        onClick={() => {
          onClose();
          onEdit();
        }}
      >
        <span className="body-14-medium text-grey-dark">{editLabel}</span>
        <span className="inline-flex">{EditIcon}</span>
      </button>

      <button
        type="button"
        className={[
          "flex w-32.75 h-13 items-center justify-between px-5 py-3",
          "hover:bg-red-50 active:bg-red-100",
        ].join(" ")}
        onClick={() => {
          onClose();
          onDelete();
        }}
      >
        <span className="body-14-medium text-red-delete">{deleteLabel}</span>
        <span className="inline-flex">{DeleteIcon}</span>
      </button>
    </div>
  );
}
