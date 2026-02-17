import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ConfirmModal from "@/components/ConfirmModal";
import ActionMenu from "@/components/ActionMenu";

import FlagSvg from "@/assets/flag.svg?react";
import FlagDotSvg from "@/assets/flag_dot.svg?react";
import Menu2Svg from "@/assets/menu2.svg?react";
import EditSvg from "@/assets/edit.svg?react";
import DeleteSvg from "@/assets/delete.svg?react";

import { deleteGoal, getFolderLightVar, getFolderNormalVar, loadGoals, type GoalItem } from "./mock";

type OpenMenu = {
  goalId: string;
};

export default function HomePage() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoalItem | null>(null);

  //초기 로드
  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  //헤더 + 버튼 이벤트 수신( AppHeaderAuto에서 쏘는 "home:add" )
  useEffect(() => {
    const onOpen = () => setAddSheetOpen(true);
    window.addEventListener("home:add", onOpen as any);
    return () => window.removeEventListener("home:add", onOpen as any);
  }, []);

  //바텀시트/모달 열리면 스크롤 잠금
  useEffect(() => {
    const anyOpen = addSheetOpen || !!deleteTarget;
    if (!anyOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [addSheetOpen, deleteTarget]);

  const isEmpty = goals.length === 0;

  const onClickAddGoal = () => {
    setAddSheetOpen(false);
    navigate("/goal");
  };

  const onClickAddFolder = () => {
    setAddSheetOpen(false);
    navigate("/folder/select");
  };

  const onClickEditGoal = (_g: GoalItem) => {
    //GoalPage가 수정 모드 아직 없으니까, 일단 "새 목표 추가"로 이동만 해둠.
    //수정 모드 붙일 때: navigate("/goal?mode=edit", { state: { goalId: g.id, title: g.title, color: g.color } })
    setOpenMenu(null);
    navigate("/goal");
  };

  const onClickDeleteGoal = (g: GoalItem) => {
    setOpenMenu(null);
    setDeleteTarget(g);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    deleteGoal(deleteTarget.id);
    setGoals(loadGoals());
    setDeleteTarget(null);
  };

  return (
    <div className="px-5 pt-6">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center pt-60 text-center">
          <FlagDotSvg className="h-4 w-4" />
          <div className="mt-3 body-14-medium text-grey-light-active">추가한 목표가 없습니다</div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {goals.map((g) => {
            const flagColor = getFolderNormalVar(g.color);
            const folderBg = getFolderLightVar(g.color);

            return (
              <div key={g.id}>
                {/*목표 헤더 라인*/}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center">
                      <FlagSvg className="h-7 w-7" style={{ color: flagColor }} />
                    </span>

                    <div className="title-16-semibold text-grey-darker">{g.title}</div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center"
                      onClick={() => setOpenMenu((cur) => (cur?.goalId === g.id ? null : { goalId: g.id }))}
                      aria-label="goal menu"
                    >
                      <Menu2Svg className="h-7 w-7" />
                    </button>

                    {/*수정/삭제 메뉴(ActionMenu가 바깥 클릭 닫기 처리함)*/}
                    <ActionMenu
                      open={openMenu?.goalId === g.id}
                      onClose={() => setOpenMenu(null)}
                      onEdit={() => onClickEditGoal(g)}
                      onDelete={() => onClickDeleteGoal(g)}
                      EditIcon={<EditSvg className="h-4 w-4" />}
                      DeleteIcon={<DeleteSvg className="h-4 w-4" />}
                    />
                  </div>
                </div>

                {/*폴더 영역(현재 폴더 저장 구조 없어서 “추가하세요”만 표시)*/}
                <div className="mt-3 overflow-hidden rounded-lg" style={{ background: folderBg }}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-5 text-left active:bg-black/5"
                    onClick={onClickAddFolder}
                  >
                    <span className="text-grey-light-active text-[18px] leading-none">+</span>
                    <span className="text-[15px] font-semibold text-grey-light-active">폴더를 추가하세요</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*하단 바텀시트: 새롭게 추가*/}
      {addSheetOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-60 bg-black/20"
            aria-label="close add sheet"
            onClick={() => setAddSheetOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-70 flex justify-center px-5 pb-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="title-16-semibold text-grey-dark">새롭게 추가</div>
                <button
                  type="button"
                  aria-label="close"
                  onClick={() => setAddSheetOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center"
                >
                  <span className="text-[20px] leading-none text-grey-light-active">×</span>
                </button>
              </div>

              <div className="mt-2 body-13-medium text-yellow-normal">새로운 목표 또는 폴더를 추가하세요</div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-md border border-grey-light bg-white py-3 text-[14px] font-semibold text-grey-normal hover:bg-grey-light-hover active:bg-grey-light-active"
                  onClick={onClickAddGoal}
                >
                  목표 추가
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-md border border-grey-light bg-white py-3 text-[14px] font-semibold text-grey-normal hover:bg-grey-light-hover active:bg-grey-light-active"
                  onClick={onClickAddFolder}
                >
                  폴더 추가
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/*삭제 확인 모달*/}
      <ConfirmModal
        open={!!deleteTarget}
        title="목표를 삭제하시겠어요?"
        description="목표 내 폴더와 할 일도 삭제돼요"
        cancelText="취소"
        confirmText="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}