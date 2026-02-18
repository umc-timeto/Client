import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ConfirmModal from "@/components/ConfirmModal";
import ActionMenu from "@/components/ActionMenu";

import FlagSvg from "@/assets/flag.svg?react";
import FlagDotSvg from "@/assets/flag_dot.svg?react";
import Menu2Svg from "@/assets/menu2.svg?react";
import EditSvg from "@/assets/edit.svg?react";
import DeleteSvg from "@/assets/delete.svg?react";
import MenuSvg from "@/assets/menu.svg?react";

import { getFolderLightVar, getFolderNormalVar } from "@/utils/ColorMapping";

import { getFoldersByGoal, setFolderOrders, type FolderItem } from "@/api/folderApi";
import { goalApi } from "@/apis/GoalPage/goal";
import { api } from "@/apis/api";

//========================
//STEP 1: 유틸
//========================
function reorderByIds<T extends { id: string }>(list: T[], fromId: string, toId: string) {
  const fromIndex = list.findIndex((it) => it.id === fromId);
  const toIndex = list.findIndex((it) => it.id === toId);
  if (fromIndex < 0 || toIndex < 0) return list;

  const next = [...list];
  const [picked] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, picked);
  return next;
}

type OpenMenu = {
  goalId: string;
};

//========================
//STEP 2: UI에서 쓰는 Goal 타입
//- 기존 HomePage 코드(g.title, g.color, g.id)를 유지하기 위한 변환 타입
//========================
type UiGoalItem = {
  id: string;
  title: string;
  color: string;
};

//========================
//STEP 3: API -> UI 변환
//========================
function toUiGoalItem(it: { id: number; name: string; color: string }): UiGoalItem {
  return {
    id: String(it.id),
    title: it.name,
    color: it.color,
  };
}

//========================
//STEP 4: 목표 삭제 API
//- goalApi 파일은 팀장님이 같이 쓰는 중이라 건드리지 않고 여기서만 사용
//========================
async function deleteGoalApi(goalId: number) {
  await api.delete(`/api/goals/${goalId}`);
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [goals, setGoals] = useState<UiGoalItem[]>([]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UiGoalItem | null>(null);

  //폴더 리렌더 트리거(로컬스토리지 기반이라 강제 리렌더 필요)
  const [folderTick, setFolderTick] = useState(0);

  //드래그 상태
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);

  //========================
  //STEP 1: 목표 리스트 로드(API)
  //========================
  const fetchGoals = useCallback(async () => {
    try {
      const list = await goalApi.getGoalList();
      setGoals(list.map(toUiGoalItem));
      setFolderTick((n) => n + 1);
    } catch (e) {
      console.error(e);
      setGoals([]);
      setFolderTick((n) => n + 1);
    }
  }, []);

  //========================
  //초기 로드/재진입 로드
  //========================
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  //라우팅으로 홈 재진입 시에도 무조건 갱신(GoalPage 저장 후 돌아올 때 focus 안 바뀌는 케이스 커버)
  useEffect(() => {
    fetchGoals();
  }, [location.key, fetchGoals]);

  //홈 화면으로 돌아오면(탭 다시 활성화) API 갱신 반영
  useEffect(() => {
    const onFocus = () => {
      fetchGoals();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchGoals]);

  //헤더 + 버튼 이벤트 수신( AppHeaderAuto에서 쏘는 "home:add" )
  useEffect(() => {
    const onOpen = () => setAddSheetOpen(true);
    window.addEventListener("home:add", onOpen as any);
    return () => window.removeEventListener("home:add", onOpen as any);
  }, []);

  //바텀시트/모달 열리면 스크롤 잠금
  useEffect(() => {
    const anyOpen = addSheetOpen || !!deleteTarget;
    document.body.classList.toggle("no-scroll", anyOpen);

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [addSheetOpen, deleteTarget]);

  const isEmpty = goals.length === 0;

  //========================
  //목표별 폴더 캐시
  //========================
  const foldersByGoalId = useMemo(() => {
    const map = new Map<string, FolderItem[]>();
    goals.forEach((g) => {
      map.set(g.id, getFoldersByGoal(g.id));
    });
    return map;
  }, [goals, folderTick]);

  const onClickAddGoal = () => {
    setAddSheetOpen(false);
    navigate("/goal");
  };

  const onClickAddFolder = () => {
    setAddSheetOpen(false);
    navigate("/folder/select");
  };

  const onClickEditGoal = (g: UiGoalItem) => {
    setOpenMenu(null);

    const q = new URLSearchParams();
    q.set("mode", "edit");
    q.set("goalId", g.id);
    q.set("return", "home");

    navigate(`/goal?${q.toString()}`, {
      state: { goalId: g.id, title: g.title, color: g.color },
    });
  };

  const onClickDeleteGoal = (g: UiGoalItem) => {
    setOpenMenu(null);
    setDeleteTarget(g);
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await deleteGoalApi(Number(deleteTarget.id));
    } catch (e) {
      console.error(e);
    }

    setDeleteTarget(null);
    fetchGoals();
  }, [deleteTarget, fetchGoals]);

  //========================
  //폴더 이동
  //========================
  const onDragStartFolder = (goalId: string, folderId: string) => {
    setDraggingGoalId(goalId);
    setDraggingFolderId(folderId);
  };

  const onDragEndFolder = () => {
    setDraggingGoalId(null);
    setDraggingFolderId(null);
  };

  const onDropFolder = (goalId: string, targetFolderId: string) => {
    if (!draggingGoalId || !draggingFolderId) return;
    if (draggingGoalId !== goalId) return;
    if (draggingFolderId === targetFolderId) return;

    const cur = getFoldersByGoal(goalId);
    const next = reorderByIds(cur, draggingFolderId, targetFolderId);
    setFolderOrders(goalId, next.map((f) => f.id));
    setFolderTick((n) => n + 1);
  };

  //========================
  //폴더 클릭 이동
  //========================
  const goFolderPage = (g: UiGoalItem, f: FolderItem) => {
    const q = new URLSearchParams();
    q.set("folderId", f.id);
    q.set("folderName", f.name);
    q.set("goalId", g.id);
    q.set("goalName", g.title);
    q.set("goalColor", g.color);

    navigate(`/folder?${q.toString()}`, {
      state: {
        folderId: f.id,
        folderName: f.name,
        goalId: g.id,
        goalName: g.title,
        goalColor: g.color,
      },
    });
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
            const folderBg = getFolderLightVar(g.color); //mock.ts에서 -light-bg로 바뀌어야 함
            const todoColor = getFolderNormalVar(g.color);

            const folders = foldersByGoalId.get(g.id) ?? [];

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

                {/*폴더 영역*/}
                <div className="mt-3 overflow-hidden rounded-lg" style={{ background: folderBg }}>
                  {folders.length === 0 ? (
                    <>
                      {/*폴더 0개일 때만:추가 버튼*/}
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-5 text-left active:bg-black/5"
                        onClick={onClickAddFolder}
                      >
                        <span className="text-grey-light-active text-[18px] leading-none">+</span>
                        <span className="text-[15px] font-semibold text-grey-light-active">폴더를 추가하세요</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/*폴더 리스트*/}
                      <div className="divide-y" style={{ borderColor: "var(--color-grey-light)" }}>
                        {folders.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            draggable
                            onDragStart={() => onDragStartFolder(g.id, f.id)}
                            onDragEnd={onDragEndFolder}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDropFolder(g.id, f.id)}
                            onClick={() => goFolderPage(g, f)}
                            className="flex w-full items-center justify-between pl-5 pr-4 active:bg-black/5"
                            style={{
                              height: 74,
                              borderBottom: "1px solid var(--color-grey-light)",
                            }}
                          >
                            {/*왼쪽:드래그 핸들 + 폴더 텍스트*/}
                            <div className="flex min-w-0 flex-1 items-center gap-[11px]">
                              <span className="inline-flex h-[27px] w-[27px] items-center justify-center">
                                <MenuSvg className="h-4 w-4" />
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="text-left truncate text-[15px] font-semibold leading-[150%] text-[#3A3A3A]">
                                  {f.name}
                                </div>
                                <div
                                  className="text-left mt-[2px] text-[13px] font-normal leading-[150%]"
                                  style={{ color: todoColor }}
                                >
                                  {`할 일 ${f.todoCount ?? 0}개`}
                                </div>
                              </div>
                            </div>

                            {/*오른쪽:자리만 유지*/}
                            <div className="h-7 w-7" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*하단 바텀시트*/}
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
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
