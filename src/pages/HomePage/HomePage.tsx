//C:\Users\tndus\Client\src\pages\HomePage\HomePage.tsx
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

import { goalApi } from "@/apis/GoalPage/goal";
import { api } from "@/apis/api";

//✅ 서버 폴더 API (FolderPage 폴더 기준)
import { folderApi } from "@/apis/FolderPage/folder.api";
import type { FolderDto } from "@/apis/FolderPage/folder.types";

//✅ dnd-kit(모바일 터치 드래그 지원)
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

//========================
// 유틸: 배열 내 id 기준 재정렬
//========================
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

//========================
//STEP 1: 폴더 Row(드래그 핸들만 드래그 가능)
//========================
function SortableFolderRow(props: {
  goalId: string;
  folder: UiFolderItem;
  todoColor: string;
  onClick: () => void;
}) {
  const { goalId, folder, todoColor, onClick } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: folder.id,
    data: { goalId },
  });

  //STEP2 드래그 중 "슉슉" 이동 효과
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex w-full items-center justify-between pl-5 pr-4",
        "active:bg-black/5",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      //STEP3 Row 클릭 시 폴더 페이지 이동
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
        {/*폴더 Row:왼쪽 영역(핸들 + 텍스트)*/}
        <div className="flex min-w-0 flex-1 items-center gap-2.75 pt-3.75 -mt-3.75">
          {/*드래그 핸들:모바일 터치 드래그 시작 지점*/}
          <div
            className="inline-flex h-6.75 w-6.75 items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MenuSvg className="h-4 w-4" />
          </div>


        {/*폴더 텍스트:이름 + 할 일 개수*/}
        <div className="min-w-0 flex-1">
          <div className="text-left truncate text-[15px] font-semibold leading-[150%] text-[#3A3A3A]">
            {folder.name}
          </div>
          <div className="text-left mt-0.5 text-[13px] font-normal leading-[150%]" style={{ color: todoColor }}>
            {`할 일 ${folder.todoCount ?? 0}개`}
          </div>
        </div>
      </div>

      {/*오른쪽 여백:디자인 유지용*/}
      <div className="h-18 w-7" />
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [goals, setGoals] = useState<UiGoalItem[]>([]);
  const [foldersByGoalId, setFoldersByGoalId] = useState<Record<string, UiFolderItem[]>>({});

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UiGoalItem | null>(null);

  //========================
  //STEP 2: 드래그 상태(dnd-kit)
  //========================
  const [, setDraggingGoalId] = useState<string | null>(null);
  const [, setDraggingFolderId] = useState<string | null>(null);

  //========================
  //STEP 3: 센서(PC + 모바일 터치)
  // - 터치에서는 롱프레스 후 드래그 시작
  //========================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
  );

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

  //✅ 목표 박스 내부에서 폴더 추가(해당 goalId 들고 이동)
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
  //STEP 4: dnd-kit 드래그 시작/종료
  //========================
  const onDragStart = useCallback((e: DragStartEvent) => {
    const goalId = String((e.active.data.current as any)?.goalId ?? "");
    setDraggingGoalId(goalId || null);
    setDraggingFolderId(String(e.active.id));
  }, []);

  const onDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const activeId = String(e.active.id);
      const overId = e.over ? String(e.over.id) : null;

      const activeGoalId = String((e.active.data.current as any)?.goalId ?? "");
      const overGoalId = String((e.over?.data.current as any)?.goalId ?? "");

      setDraggingGoalId(null);
      setDraggingFolderId(null);

      //STEP4-1 드롭 대상이 없으면 종료
      if (!overId) return;

      //STEP4-2 같은 goal 내에서만 reorder 허용
      if (!activeGoalId || !overGoalId) return;
      if (activeGoalId !== overGoalId) return;
      if (activeId === overId) return;

      const cur = foldersByGoalId[activeGoalId] ?? [];
      const fromIndex = cur.findIndex((it) => it.id === activeId);
      const toIndex = cur.findIndex((it) => it.id === overId);
      if (fromIndex < 0 || toIndex < 0) return;

      const next = arrayMove(cur, fromIndex, toIndex);
      const newIndex = next.findIndex((it) => it.id === activeId);
      if (newIndex < 0) return;

      //STEP4-3 UI 먼저 반영(낙관적 업데이트)
      setFoldersByGoalId((prev) => ({ ...prev, [activeGoalId]: next }));

      try {
        await folderApi.moveFolder(Number(activeId), newIndex);

        //STEP4-4 서버 동기화(해당 goal만 갱신)
        const refreshed = await folderApi.getFoldersByGoal(Number(activeGoalId));
        setFoldersByGoalId((prev) => ({ ...prev, [activeGoalId]: refreshed.map(toUiFolderItem) }));
      } catch (err) {
        console.error(err);

        //STEP4-5 실패 시 롤백(해당 goal만 갱신)
        try {
          const rollback = await folderApi.getFoldersByGoal(Number(activeGoalId));
          setFoldersByGoalId((prev) => ({ ...prev, [activeGoalId]: rollback.map(toUiFolderItem) }));
        } catch (e2) {
          console.error(e2);
        }
      }
    },
    [foldersByGoalId],
  );

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

  //========================
  //STEP 5: 각 goal별 폴더 id 리스트 메모
  //========================
  const folderIdsByGoalId = useMemo(() => {
    const next: Record<string, string[]> = {};
    goals.forEach((g) => {
      const folders = foldersByGoalId[g.id] ?? [];
      next[g.id] = folders.map((f) => f.id);
    });
    return next;
  }, [goals, foldersByGoalId]);

  return (
    <div className="px-5 pt-6">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center pt-60 text-center">
          <FlagDotSvg className="h-4 w-4" />
          <div className="mt-3 body-14-medium text-grey-light-active">추가한 목표가 없습니다</div>
        </div>
      ) : (
        //========================
        //STEP 6: 드래그 컨텍스트(모바일 포함)
        //========================
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex flex-col gap-6">
            {goals.map((g) => {
              const flagColor = getFolderNormalVar(g.color);
              const folderBg = getFolderLightVar(g.color);
              const todoColor = getFolderNormalVar(g.color);

              const folders = foldersByGoalId[g.id] ?? [];
              const folderIds = folderIdsByGoalId[g.id] ?? [];

              return (
                <div key={g.id}>
                  {/*목표 헤더*/}
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

                  {/*폴더 영역*/}
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
                      //========================
                      //STEP 7: goal 단위 Sortable(같은 goal 내에서만 이동)
                      //========================
                      <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
                        <div className="divide-y" style={{ borderColor: "var(--color-grey-light)" }}>
                          {folders.map((f) => (
                            <div
                              key={f.id}
                              style={{
                                height: 74,
                                borderBottom: "1px solid var(--color-grey-light)",
                              }}
                            >
                              <SortableFolderRow
                                goalId={g.id}
                                folder={f}
                                todoColor={todoColor}
                                onClick={() => goFolderPage(g, f)}
                              />
                            </div>
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
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
