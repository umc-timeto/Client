//C:\Users\tndus\Client\src\pages\FolderPage\FolderPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import ActionMenu from "@/components/ActionMenu";
import ConfirmModal from "@/components/ConfirmModal";
import TaskInfoModal from "@/components/TaskInfoModal";

import FlagSvg from "@/assets/flag.svg?react";
import EditSvg from "@/assets/edit.svg?react";
import DeleteSvg from "@/assets/delete.svg?react";

import MenuGreenSvg from "@/assets/menu_green.svg?react";
import MenuYellowSvg from "@/assets/menu_yellow.svg?react";

import FProgressSvg from "@/assets/f_progress.svg?react";
import FDoneSvg from "@/assets/f_done.svg?react";

import { folderApi } from "@/apis/FolderPage/folder.api";
import { taskApi } from "@/apis/TaskPage/task.api";

//✅ utils로 분리한 것들
import { toUiTaskFromSummary, type UiTaskWithOrder } from "@/utils/TaskMapping";
import { formatDuration, formatMMDD_DOW, buildModalDateTimeTexts } from "@/utils/TaskTime";

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
//아이콘 유틸(이건 페이지 로컬 유지)
//========================
function PlusGreenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M12 6.5H6.5M6.5 6.5H1M6.5 6.5V1M6.5 6.5V12"
        stroke="#00B1A6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusGreyRotateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M12 6.5H6.5M6.5 6.5H1M6.5 6.5V1M6.5 6.5V12" stroke="#C2C2C2" />
    </svg>
  );
}

//========================
//STEP 1: Sortable Row(핸들만 드래그 가능)
//========================
function SortableTaskRow(props: {
  section: "progress" | "done";
  task: UiTaskWithOrder;
  onClick: () => void;
}) {
  const { section, task, onClick } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { section },
  });

  //드래그 중 "슉슉" 이동 효과
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const isDone = section === "done";
  const rowHover = isDone
    ? "hover:bg-yellow-light-hover active:bg-yellow-light-active"
    : "hover:bg-green-light-hover active:bg-green-light-active";
  const titleClass = isDone
    ? "truncate text-[15px] font-semibold leading-[150%] text-[#B0B0B0] line-through"
    : "truncate text-[15px] font-semibold leading-[150%] text-[#2C2C2C]";

  const badgeBg = isDone ? "#F7941D" : "#00B1A6";
  const badgeBorder = isDone ? "#F7941D" : "#00B1A6";
  const badgeText = isDone ? "#F7941D" : "#00B1A6";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={["flex w-full items-center justify-between px-4 py-6 text-left", rowHover, isDragging ? "opacity-70" : ""].join(" ")}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      {/*왼쪽(핸들 + 텍스트)*/}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/*드래그 핸들*/}
        <div
          className="touch-none select-none cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {isDone ? <MenuYellowSvg className="h-[11.25px] w-3" /> : <MenuGreenSvg className="h-[11.25px] w-3" />}
        </div>

        <div className="min-w-0">
          <div className={titleClass}>{task.title}</div>

          {/*startAt 있을 때만 날짜 표시*/}
          {task._startAt ? (
            <div className="mt-1 font-pretendard text-[13px] font-normal leading-[150%] text-[#00857D]">
              {formatMMDD_DOW(task._startAt)}
            </div>
          ) : null}
        </div>
      </div>

      {/*오른쪽(중요도 + 소요시간)*/}
      <div className="flex items-center gap-2">
        <span
          className="flex h-5.5 w-5.5 items-center justify-center rounded-xs text-[12px] font-semibold leading-[120%] text-white"
          style={{ background: badgeBg }}
        >
          {task.priority}
        </span>

        <span
          className="flex h-5.5 w-13 items-center justify-center rounded-[3px] border text-[12px] font-semibold"
          style={{ borderColor: badgeBorder, color: badgeText }}
        >
          {formatDuration(task.durationMinutes)}
        </span>
      </div>
    </div>
  );
}

export default function FolderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  //========================
  //폴더/목표 정보
  //========================
  const folderId = searchParams.get("folderId") ?? "";
  const folderIdNum = Number(folderId);

  const folderNameFromState = (location.state as { folderName?: string } | null)?.folderName;
  const folderNameFromQuery = searchParams.get("folderName") ?? undefined;
  const folderName = folderNameFromState ?? folderNameFromQuery ?? "폴더";

  const goalNameFromState = (location.state as { goalName?: string } | null)?.goalName;
  const goalNameFromQuery = searchParams.get("goalName") ?? undefined;
  const goalName = goalNameFromState ?? goalNameFromQuery ?? "SQLD";

  const goalIdFromState = (location.state as { goalId?: string } | null)?.goalId;
  const goalIdFromQuery = searchParams.get("goalId") ?? undefined;
  const goalId = goalIdFromState ?? goalIdFromQuery ?? null;

  const goalColorFromState = (location.state as { goalColor?: string } | null)?.goalColor;
  const goalColorFromQuery = searchParams.get("goalColor") ?? undefined;
  const goalColor = goalColorFromState ?? goalColorFromQuery ?? "#00B1A6";

  useEffect(() => {
    if (!folderId) {
      navigate("/home", { replace: true });
      return;
    }
    if (!Number.isFinite(folderIdNum)) {
      navigate("/home", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  //========================
  //메뉴/모달
  //========================
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setMenuOpen(true);
    window.addEventListener("folder:menu", onOpen as any);
    return () => window.removeEventListener("folder:menu", onOpen as any);
  }, []);

  //========================
  //목록 상태
  //========================
  const [progressTasks, setProgressTasks] = useState<UiTaskWithOrder[]>([]);
  const [doneTasks, setDoneTasks] = useState<UiTaskWithOrder[]>([]);

  //========================
  //드래그 상태(dnd-kit)
  //========================
  const [, setDraggingId] = useState<string | null>(null);
  const [, setDraggingSection] = useState<"progress" | "done" | null>(null);

  //========================
  //센서(PC + 모바일 터치)
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
  //할 일 정보 모달
  //========================
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const openTask = useMemo(() => {
    if (!openTaskId) return null;
    return progressTasks.find((t) => t.id === openTaskId) ?? doneTasks.find((t) => t.id === openTaskId) ?? null;
  }, [openTaskId, progressTasks, doneTasks]);

  //모달 상단 문구
  const [modalTimeText, setModalTimeText] = useState<string>("-");
  const [modalDateText, setModalDateText] = useState<string>("--/--");

  //========================
  //서버 로드
  //========================
  const load = useCallback(async () => {
    if (!Number.isFinite(folderIdNum)) return;

    try {
      const [pRes, dRes] = await Promise.all([taskApi.getProgressTodos(folderIdNum), taskApi.getCompleteTodos(folderIdNum)]);

      const p = (pRes.todos ?? []).map((it) => toUiTaskFromSummary(it, "progress"));
      const d = (dRes.todos ?? []).map((it) => toUiTaskFromSummary(it, "complete"));

      setProgressTasks(p);
      setDoneTasks(d);
    } catch (e) {
      console.error(e);
      setProgressTasks([]);
      setDoneTasks([]);
    }
  }, [folderIdNum]);

  useEffect(() => {
    if (!folderId) return;
    load();
  }, [folderId, location.key, load]);

  //========================
  //쿼리로 모달 자동 오픈
  //========================
  const modalTaskIdFromQuery = searchParams.get("modalTaskId") ?? searchParams.get("openTaskId");

  useEffect(() => {
    if (!modalTaskIdFromQuery) return;

    setOpenTaskId(String(modalTaskIdFromQuery));

    const next = new URLSearchParams(searchParams);
    next.delete("modalTaskId");
    next.delete("openTaskId");
    navigate(`?${next.toString()}`, { replace: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalTaskIdFromQuery]);

  //========================
  //openTaskId 열리면 detail 조회해서 모달 시간/날짜 세팅
  //========================
  useEffect(() => {
    if (!openTaskId) {
      setModalTimeText("00:00-00:00");
      setModalDateText("--/--");
      return;
    }

    const todoId = Number(openTaskId);
    if (!Number.isFinite(todoId)) {
      setModalTimeText("00:00-00:00");
      setModalDateText("--/--");
      return;
    }

    (async () => {
      try {
        const dto = await taskApi.getTodo(todoId);
        const { dateText, timeText } = buildModalDateTimeTexts({ startAt: dto.startAt, duration: dto.duration });

        setModalDateText(dateText);
        setModalTimeText(timeText);
      } catch (e) {
        console.error(e);
        setModalTimeText("-");
        setModalDateText("--/--");
      }
    })();
  }, [openTaskId]);

  //========================
  //스크롤 잠금
  //========================
  useEffect(() => {
    const anyOpen = Boolean(openTaskId) || deleteConfirmOpen || menuOpen;
    document.body.classList.toggle("no-scroll", anyOpen);

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [openTaskId, deleteConfirmOpen, menuOpen]);

  //========================
  //할 일 추가 이동(goal 정보 같이 넘김)
  //========================
  const goTaskAdd = () => {
    const q = new URLSearchParams();
    q.set("step", "1");
    q.set("folderId", folderId);
    q.set("folderName", String(folderName));
    q.set("return", "folder");
    if (goalId) q.set("goalId", goalId);
    q.set("goalName", goalName);
    q.set("goalColor", goalColor);

    navigate(`/task?${q.toString()}`, {
      state: { folderId, folderName, goalId, goalName, goalColor },
    });
  };

  const closeModal = () => setOpenTaskId(null);

  //완료 토글
  const toggleDoneFromModal = async () => {
    if (!openTask) return;
    const todoId = Number(openTask.id);
    if (!Number.isFinite(todoId)) return;

    try {
      await taskApi.updateTodoStatus(todoId, { state: openTask.isDone ? "progress" : "complete" });
      closeModal();
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  //삭제
  const removeFromModal = async () => {
    if (!openTask) return;
    const todoId = Number(openTask.id);
    if (!Number.isFinite(todoId)) return;

    try {
      await taskApi.deleteTodo(todoId);
      closeModal();
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  //========================
  //편집 이동(goal 정보 같이 넘김)
  //========================
  const goEditStep1 = () => {
    if (!openTask) return;

    const q = new URLSearchParams();
    q.set("step", "1");
    q.set("folderId", folderId);
    q.set("folderName", String(folderName));
    q.set("taskId", String(openTask.id));
    q.set("return", "folder");
    if (goalId) q.set("goalId", goalId);
    q.set("goalName", goalName);
    q.set("goalColor", goalColor);

    navigate(`/task?${q.toString()}`, { state: { folderId, folderName, goalId, goalName, goalColor } });
  };

  const goEditStep2 = () => {
    if (!openTask) return;

    const q = new URLSearchParams();
    q.set("step", "2");
    q.set("folderId", folderId);
    q.set("folderName", String(folderName));
    q.set("taskId", String(openTask.id));
    q.set("return", "folder");
    if (goalId) q.set("goalId", goalId);
    q.set("goalName", goalName);
    q.set("goalColor", goalColor);

    navigate(`/task?${q.toString()}`, { state: { folderId, folderName, goalId, goalName, goalColor } });
  };

  //========================
  //드래그(dnd-kit)
  //========================
  const onDragStart = useCallback((e: DragStartEvent) => {
    const section = String((e.active.data.current as any)?.section ?? "");
    setDraggingId(String(e.active.id));
    setDraggingSection(section === "done" ? "done" : "progress");
    console.log("DRAG START", e.active.id, e.active.data.current); //디버깅용
  }, []);

  const onDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const activeId = String(e.active.id);
      const overId = e.over ? String(e.over.id) : null;

      const activeSectionRaw = String((e.active.data.current as any)?.section ?? "");
      const overSectionRaw = String((e.over?.data.current as any)?.section ?? "");

      const activeSection = activeSectionRaw === "done" ? "done" : "progress";
      const overSection = overSectionRaw === "done" ? "done" : "progress";

      setDraggingId(null);
      setDraggingSection(null);

      //드롭 대상 없으면 종료
      if (!overId) return;

      //같은 섹션 내에서만 reorder
      if (activeSection !== overSection) return;
      if (activeId === overId) return;

      const cur = activeSection === "progress" ? progressTasks : doneTasks;
      const fromIndex = cur.findIndex((t) => t.id === activeId);
      const toIndex = cur.findIndex((t) => t.id === overId);
      if (fromIndex < 0 || toIndex < 0) return;

      const next = arrayMove(cur, fromIndex, toIndex);
      if (activeSection === "progress") setProgressTasks(next);
      else setDoneTasks(next);

      const todoId = Number(activeId);
      if (!Number.isFinite(todoId)) {
        await load();
        return;
      }

      const overTask = cur.find((t) => t.id === overId) as UiTaskWithOrder | undefined;
      const fallbackOrder = toIndex + 1;
      const targetOrder = typeof overTask?._sortOrder === "number" ? overTask._sortOrder : fallbackOrder;

      try {
        await taskApi.updateTodoOrder(todoId, { targetOrder });
        await load();
      } catch (err) {
        console.error(err);
        await load();
      }
    },
    [progressTasks, doneTasks, load],
  );

  const progressCount = useMemo(() => progressTasks.length, [progressTasks]);
  const doneCount = useMemo(() => doneTasks.length, [doneTasks]);

  //========================
  //폴더 수정/삭제
  //========================
  const goFolderEdit = () => {
    const q = new URLSearchParams();
    q.set("mode", "edit");
    q.set("step", "2");
    q.set("canSave", "0");

    if (goalId) q.set("goalId", goalId);
    q.set("goalName", goalName);
    q.set("goalColor", goalColor);

    q.set("folderId", folderId);
    q.set("folderName", String(folderName));

    setMenuOpen(false);
    navigate(`/folder/select?${q.toString()}`, {
      state: { goalId, goalName, goalColor, folderId, folderName },
    });
  };

  const deleteFolder = async () => {
    setDeleteConfirmOpen(false);

    if (!Number.isFinite(folderIdNum)) {
      navigate("/home", { replace: true });
      return;
    }

    try {
      await folderApi.deleteFolder(folderIdNum);
      navigate("/home", { replace: true });
    } catch (e) {
      console.error(e);
    }
  };

  //========================
  //렌더
  //========================
  const progressIds = useMemo(() => progressTasks.map((t) => t.id), [progressTasks]);
  const doneIds = useMemo(() => doneTasks.map((t) => t.id), [doneTasks]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="bg-white px-5 pt-6 pb-24">
        <div className="mb-6 flex items-center justify-center gap-2">
          <FlagSvg className="h-4 w-4" style={{ color: goalColor }} />
          <span className="text-[12px] font-semibold text-[#3A3A3A]">{goalName}</span>
        </div>

        <ActionMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onEdit={goFolderEdit}
          onDelete={() => {
            setMenuOpen(false);
            setDeleteConfirmOpen(true);
          }}
          EditIcon={<EditSvg className="h-4 w-4" />}
          DeleteIcon={<DeleteSvg className="h-4 w-4" />}
          className="right-5 top-25"
        />

        {/*진행 섹션*/}
        <div className="flex gap-3">
          <div className="flex w-4 flex-col items-center">
            <FProgressSvg className="h-6 w-6" />
            <div className="mt-2 flex-1 w-px border-l border-dotted border-[#B0E7E3]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#00857D]">
                <span>{`진행 (${progressCount}개)`}</span>
              </div>

              <button
                type="button"
                onClick={goTaskAdd}
                aria-label="add task"
                className="grid h-7 w-7 place-items-center rounded-md hover:bg-black/5 active:bg-black/10"
              >
                <span>
                  <PlusGreyRotateIcon />
                </span>
              </button>
            </div>

            {progressCount === 0 ? (
              <button
                type="button"
                onClick={goTaskAdd}
                className={["flex w-full items-center justify-start gap-3 rounded-lg bg-[#E6F7F6] py-7 pl-5", "hover:bg-[#D9F2F0] active:bg-[#CDEDEA]"].join(" ")}
              >
                <PlusGreenIcon />
                <span className="text-[13px] font-semibold leading-[150%] text-[#00857D]">할 일을 추가하세요</span>
              </button>
            ) : (
              <SortableContext items={progressIds} strategy={verticalListSortingStrategy}>
                <div className="overflow-hidden rounded-lg border border-[#00B1A6] bg-white">
                  <div className="divide-y divide-[#B0E7E3]">
                    {progressTasks.map((t) => (
                      <SortableTaskRow key={t.id} section="progress" task={t} onClick={() => setOpenTaskId(t.id)} />
                    ))}
                  </div>
                </div>
              </SortableContext>
            )}
          </div>
        </div>

        {/*완료 섹션*/}
        {doneCount > 0 && (
          <div className="mt-8 flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <FDoneSvg className="h-4 w-4" />
              <div className="mt-2 flex-1 w-px border-l border-dotted border-[#FFE7B0]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#F7941D]">
                  <span>{`완료 (${doneCount}개)`}</span>
                </div>
                <div className="h-7 w-7" />
              </div>

              <SortableContext items={doneIds} strategy={verticalListSortingStrategy}>
                <div className="overflow-hidden rounded-lg border border-[#F7941D] bg-white">
                  <div className="divide-y divide-[#FFE7B0]">
                    {doneTasks.map((t) => (
                      <SortableTaskRow key={t.id} section="done" task={t} onClick={() => setOpenTaskId(t.id)} />
                    ))}
                  </div>
                </div>
              </SortableContext>
            </div>
          </div>
        )}

        {/*할 일 정보 모달*/}
        <TaskInfoModal
          open={Boolean(openTask)}
          title={openTask?.title ?? ""}
          durationText={openTask ? formatDuration(openTask.durationMinutes) : ""}
          priorityText={openTask?.priority ?? ""}
          isDone={Boolean(openTask?.isDone)}
          modalDateText={modalDateText}
          modalTimeText={modalTimeText}
          onClose={closeModal}
          onEditStep1={goEditStep1}
          onEditStep2={goEditStep2}
          onDelete={removeFromModal}
          onToggleDone={toggleDoneFromModal}
        />

        <ConfirmModal
          open={deleteConfirmOpen}
          title="폴더를 삭제하시겠어요?"
          description="폴더 내 할 일도 삭제돼요"
          cancelText="취소"
          confirmText="삭제"
          variant="danger"
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={deleteFolder}
        />
      </div>
    </DndContext>
  );
}
