import { useCallback, useEffect, useState } from "react";
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

import { goalApi } from "@/apis/GoalPage/goal";
import { api } from "@/apis/api";

// ✅ 서버 폴더 API (FolderPage 폴더 기준)
import { folderApi } from "@/apis/FolderPage/folder.api";
import type { FolderDto } from "@/apis/FolderPage/folder.types";

//========================
// 유틸: 배열 내 id 기준 재정렬
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
// UI Goal 타입
//========================
type UiGoalItem = {
  id: string;
  title: string;
  color: string;
};

//========================
// UI Folder 타입
// - 서버 ingTodoCount -> UI todoCount로 매핑
//========================
type UiFolderItem = {
  id: string;
  name: string;
  todoCount: number;
};

function toUiGoalItem(it: { id: number; name: string; color: string }): UiGoalItem {
  return {
    id: String(it.id),
    title: it.name,
    color: it.color,
  };
}

function toUiFolderItem(dto: FolderDto): UiFolderItem {
  return {
    id: String(dto.id),
    name: dto.name,
    todoCount: dto.ingTodoCount ?? 0,
  };
}

//========================
// 목표 삭제 API
//========================
async function deleteGoalApi(goalId: number) {
  await api.delete(`/api/goals/${goalId}`);
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [goals, setGoals] = useState<UiGoalItem[]>([]);
  const [foldersByGoalId, setFoldersByGoalId] = useState<Record<string, UiFolderItem[]>>({});

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UiGoalItem | null>(null);

  // 드래그 상태
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);

  //========================
  // 목표 리스트 로드
  //========================
  const fetchGoals = useCallback(async () => {
    try {
      const list = await goalApi.getGoalList();
      const uiGoals = list.map(toUiGoalItem);
      setGoals(uiGoals);
      return uiGoals;
    } catch (e) {
      console.error(e);
      setGoals([]);
      return [] as UiGoalItem[];
    }
  }, []);

  //========================
  // goalId별 폴더 로드
  //========================
  const fetchFoldersForGoals = useCallback(async (uiGoals: UiGoalItem[]) => {
    try {
      const results = await Promise.all(
        uiGoals.map(async (g) => {
          const folders = await folderApi.getFoldersByGoal(Number(g.id));
          return [g.id, folders.map(toUiFolderItem)] as const;
        }),
      );

      const next: Record<string, UiFolderItem[]> = {};
      results.forEach(([goalId, folders]) => {
        next[goalId] = folders;
      });

      setFoldersByGoalId(next);
    } catch (e) {
      console.error(e);
      setFoldersByGoalId({});
    }
  }, []);

  //========================
  // 홈 갱신(목표 -> 폴더 순으로)
  //========================
  const refreshHome = useCallback(async () => {
    const uiGoals = await fetchGoals();
    await fetchFoldersForGoals(uiGoals);
  }, [fetchGoals, fetchFoldersForGoals]);

  // 초기 로드
  useEffect(() => {
    refreshHome();
  }, [refreshHome]);

  // 라우팅으로 재진입 시 갱신
  useEffect(() => {
    refreshHome();
  }, [location.key, refreshHome]);

  // 탭 다시 활성화 시 갱신
  useEffect(() => {
    const onFocus = () => refreshHome();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshHome]);

  // 헤더 + 버튼 이벤트 수신 (AppHeaderAuto가 "home:add" 쏨)
  useEffect(() => {
    const onOpen = () => setAddSheetOpen(true);
    window.addEventListener("home:add", onOpen as any);
    return () => window.removeEventListener("home:add", onOpen as any);
  }, []);

  // 바텀시트/모달 열리면 스크롤 잠금
  useEffect(() => {
    const anyOpen = addSheetOpen || !!deleteTarget;
    document.body.classList.toggle("no-scroll", anyOpen);

    return () => {
      document.body.classList.remove("no-scroll");
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

  // ✅ 목표 박스 내부에서 폴더 추가(해당 goalId 들고 이동)
  const onClickAddFolderInGoal = (goalId: string) => {
    setAddSheetOpen(false);

    const q = new URLSearchParams();
    q.set("mode", "create");
    q.set("step", "2");
    q.set("goalId", goalId);
    q.set("canSave", "0");

    navigate(`/folder/select?${q.toString()}`);
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
    await refreshHome();
  }, [deleteTarget, refreshHome]);

  //========================
  // 폴더 이동(드래그&드롭) - 서버: moveFolder(folderId, newIndex)
  // newIndex는 0-based
  //========================
  const onDragStartFolder = (goalId: string, folderId: string) => {
    setDraggingGoalId(goalId);
    setDraggingFolderId(folderId);
  };

  const onDragEndFolder = () => {
    setDraggingGoalId(null);
    setDraggingFolderId(null);
  };

  const onDropFolder = async (goalId: string, targetFolderId: string) => {
    if (!draggingGoalId || !draggingFolderId) return;
    if (draggingGoalId !== goalId) return;
    if (draggingFolderId === targetFolderId) return;

    const cur = foldersByGoalId[goalId] ?? [];
    const next = reorderByIds(cur, draggingFolderId, targetFolderId);

    const newIndex = next.findIndex((f) => f.id === draggingFolderId);
    if (newIndex < 0) return;

    // UI 먼저 반영
    setFoldersByGoalId((prev) => ({ ...prev, [goalId]: next }));

    try {
      await folderApi.moveFolder(Number(draggingFolderId), newIndex);

      // 서버 동기화
      const refreshed = await folderApi.getFoldersByGoal(Number(goalId));
      setFoldersByGoalId((prev) => ({ ...prev, [goalId]: refreshed.map(toUiFolderItem) }));
    } catch (e) {
      console.error(e);

      // 실패 시 롤백
      try {
        const rollback = await folderApi.getFoldersByGoal(Number(goalId));
        setFoldersByGoalId((prev) => ({ ...prev, [goalId]: rollback.map(toUiFolderItem) }));
      } catch (e2) {
        console.error(e2);
      }
    }
  };

  //========================
  // 폴더 클릭 이동
  //========================
  const goFolderPage = (g: UiGoalItem, f: UiFolderItem) => {
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
            const folderBg = getFolderLightVar(g.color);
            const todoColor = getFolderNormalVar(g.color);

            const folders = foldersByGoalId[g.id] ?? [];

            return (
              <div key={g.id}>
                {/* 목표 헤더 */}
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

                {/* 폴더 영역 */}
                <div className="mt-3 overflow-hidden rounded-lg" style={{ background: folderBg }}>
                  {folders.length === 0 ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-5 text-left active:bg-black/5"
                      onClick={() => onClickAddFolderInGoal(g.id)}
                    >
                      <span className="text-grey-light-active text-[18px] leading-none">+</span>
                      <span className="text-[15px] font-semibold text-grey-light-active">폴더를 추가하세요</span>
                    </button>
                  ) : (
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

                          <div className="h-7 w-7" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 바텀시트 */}
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

      {/* 삭제 확인 모달 */}
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
