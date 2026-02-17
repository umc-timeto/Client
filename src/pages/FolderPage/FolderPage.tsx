import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Task } from "@/types/task";
import { deleteTask, ensureMockSeed, getTasksByFolder, setTasksByFolder } from "@/api/taskApi";
import { mockTasks } from "@/pages/TaskPage/mock";

import ActionMenu from "@/components/ActionMenu";
import ConfirmModal from "@/components/ConfirmModal";

import FlagSvg from "@/assets/flag.svg?react";
import EditSvg from "@/assets/edit.svg?react";
import DeleteSvg from "@/assets/delete.svg?react";

import MenuGreenSvg from "@/assets/menu_green.svg?react";
import MenuYellowSvg from "@/assets/menu_yellow.svg?react";
import NextDarkSvg from "@/assets/next-dark.svg?react";

import FProgressSvg from "@/assets/f_progress.svg?react";
import FDoneSvg from "@/assets/f_done.svg?react";

//========================
//STEP 1: 유틸
//========================
function formatDuration(minutes: number) {
  const m = Math.max(0, minutes ?? 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}H ${mm}M`;
  if (h > 0) return `${h}H`;
  return `${mm}M`;
}

function reorderByIds(list: Task[], fromId: string, toId: string) {
  const fromIndex = list.findIndex((t) => t.id === fromId);
  const toIndex = list.findIndex((t) => t.id === toId);
  if (fromIndex < 0 || toIndex < 0) return list;

  const next = [...list];
  const [picked] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, picked);
  return next;
}

function PlusGreenIcon() {
  //요구한 + svg (stroke #00B1A6)
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
      <path
        d="M12 6.5H6.5M6.5 6.5H1M6.5 6.5V1M6.5 6.5V12"
        stroke="#C2C2C2"
      />
    </svg>
  );
}

//========================
//STEP 2: 페이지
//========================
export default function FolderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  //========================
  //STEP2 폴더 정보(임시)
  //========================
  const folderId = searchParams.get("folderId") ?? "f1";

  const folderNameFromState = (location.state as { folderName?: string } | null)?.folderName;
  const folderNameFromQuery = searchParams.get("folderName") ?? undefined;
  const folderName = folderNameFromState ?? folderNameFromQuery ?? "폴더";

  //========================
  //STEP2 목표 정보(퍼블리싱용 임시)
  //========================
  const goalNameFromState = (location.state as { goalName?: string } | null)?.goalName;
  const goalNameFromQuery = searchParams.get("goalName") ?? undefined;
  const goalName = goalNameFromState ?? goalNameFromQuery ?? "SQLD"; //요구: 하드코딩이라도 보여주기

  const goalIdFromState = (location.state as { goalId?: string } | null)?.goalId;
  const goalIdFromQuery = searchParams.get("goalId") ?? undefined;
  const goalId = goalIdFromState ?? goalIdFromQuery ?? null;

  const goalColorFromState = (location.state as { goalColor?: string } | null)?.goalColor;
  const goalColorFromQuery = searchParams.get("goalColor") ?? undefined;
  const goalColor = goalColorFromState ?? goalColorFromQuery ?? "#00B1A6";

  //========================
  //STEP2 폴더 액션 메뉴/삭제 모달
  //========================
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  //AppHeaderAuto에서 쏘는 "folder:menu" 수신 (HomePage랑 동일 패턴)
  useEffect(() => {
    const onOpen = () => setMenuOpen(true);
    window.addEventListener("folder:menu", onOpen as any);
    return () => window.removeEventListener("folder:menu", onOpen as any);
  }, []);

  //========================
  //STEP2 목록 상태
  //========================
  const [progressTasks, setProgressTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);

  //========================
  //STEP2 드래그 상태
  //========================
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingSection, setDraggingSection] = useState<"progress" | "done" | null>(null);

  //========================
  //STEP2 할 일 정보 모달
  //========================
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);

  const openTask = useMemo(() => {
    if (!openTaskId) return null;
    return (
      progressTasks.find((t) => t.id === openTaskId) ??
      doneTasks.find((t) => t.id === openTaskId) ??
      null
    );
  }, [openTaskId, progressTasks, doneTasks]);

  //========================
  //STEP3 초기 로드/리로드
  //========================
  const load = async () => {
    ensureMockSeed(mockTasks);

    const list = await getTasksByFolder(folderId);
    const p = list.filter((t) => !t.isDone);
    const d = list.filter((t) => t.isDone);

    setProgressTasks(p);
    setDoneTasks(d);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, location.key]);

  //========================
  //STEP3 쿼리로 모달 자동 오픈
  //========================
  const modalTaskIdFromQuery = searchParams.get("modalTaskId") ?? searchParams.get("openTaskId");

  useEffect(() => {
    if (!modalTaskIdFromQuery) return;

    setOpenTaskId(modalTaskIdFromQuery);

    const next = new URLSearchParams(searchParams);
    next.delete("modalTaskId");
    next.delete("openTaskId");
    navigate(`?${next.toString()}`, { replace: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalTaskIdFromQuery]);

  //========================
  //STEP3 모달/모달류 열림 시 스크롤 잠금
  //========================
  useEffect(() => {
    const anyOpen = !!openTaskId || deleteConfirmOpen || menuOpen;
    if (!anyOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openTaskId, deleteConfirmOpen, menuOpen]);

  //========================
  //STEP3 저장(로컬스토리지 반영)
  //========================
  const persist = async (nextProgress: Task[], nextDone: Task[]) => {
    await setTasksByFolder(folderId, [...nextProgress, ...nextDone]);
  };

  //========================
  //STEP3 할 일 추가 이동
  //========================
  const goTaskAdd = () => {
    navigate(
      `/task?step=1&folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(
        String(folderName)
      )}&return=folder`,
      { state: { folderId, folderName } }
    );
  };

  //========================
  //STEP3 모달 닫기
  //========================
  const closeModal = () => setOpenTaskId(null);

  //========================
  //STEP3 완료 토글(모달 버튼)
  //========================
  const toggleDoneFromModal = async () => {
    if (!openTask) return;

    if (openTask.isDone) {
      //완료 -> 진행
      const nextDone = doneTasks.filter((t) => t.id !== openTask.id);
      const nextProgress = [...progressTasks, { ...openTask, isDone: false }];
      setDoneTasks(nextDone);
      setProgressTasks(nextProgress);
      await persist(nextProgress, nextDone);
      closeModal();
      return;
    }

    //진행 -> 완료
    const nextProgress = progressTasks.filter((t) => t.id !== openTask.id);
    const nextDone = [...doneTasks, { ...openTask, isDone: true }];
    setProgressTasks(nextProgress);
    setDoneTasks(nextDone);
    await persist(nextProgress, nextDone);
    closeModal();
  };

  //========================
  //STEP3 삭제(모달 버튼)
  //========================
  const removeFromModal = async () => {
    if (!openTask) return;

    await deleteTask(openTask.id);

    const nextProgress = progressTasks.filter((t) => t.id !== openTask.id);
    const nextDone = doneTasks.filter((t) => t.id !== openTask.id);
    setProgressTasks(nextProgress);
    setDoneTasks(nextDone);

    closeModal();
  };

  //========================
  //STEP3 편집 이동(모달 클릭 영역)
  //========================
  const goEditStep1 = () => {
    if (!openTask) return;
    navigate(
      `/task?step=1&folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(
        String(folderName)
      )}&taskId=${encodeURIComponent(openTask.id)}&return=folder`,
      { state: { folderId, folderName } }
    );
  };

  const goEditStep2 = () => {
    if (!openTask) return;
    navigate(
      `/task?step=2&folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(
        String(folderName)
      )}&taskId=${encodeURIComponent(openTask.id)}&return=folder`,
      { state: { folderId, folderName } }
    );
  };

  //========================
  //STEP3 드래그 핸들러
  //========================
  const onDragStart = (taskId: string, section: "progress" | "done") => {
    setDraggingId(taskId);
    setDraggingSection(section);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDraggingSection(null);
  };

  const onDropOnItem = async (targetId: string, section: "progress" | "done") => {
    //박스 간 드래그 이동 금지
    if (!draggingId || !draggingSection) return;
    if (draggingSection !== section) return;
    if (draggingId === targetId) return;

    if (section === "progress") {
      const nextProgress = reorderByIds(progressTasks, draggingId, targetId);
      setProgressTasks(nextProgress);
      await persist(nextProgress, doneTasks);
      return;
    }

    const nextDone = reorderByIds(doneTasks, draggingId, targetId);
    setDoneTasks(nextDone);
    await persist(progressTasks, nextDone);
  };

  //========================
  //STEP3 카운트
  //========================
  const progressCount = useMemo(() => progressTasks.length, [progressTasks]);
  const doneCount = useMemo(() => doneTasks.length, [doneTasks]);

  //========================
  //STEP3 폴더 수정/삭제
  //========================
  const goFolderEdit = () => {
    const q = new URLSearchParams();
    q.set("canSave", "0");
    q.set("step", "2");
    if (goalId) q.set("goalId", goalId);

    q.set("folderId", folderId);
    q.set("folderName", String(folderName));

    setMenuOpen(false);
    navigate(`/folder/select?${q.toString()}`, {
      state: {
        goalId,
        folderId,
        folderName,
      },
    });
  };

  const deleteFolder = async () => {
    //API 붙기 전: 화면만 빠져나감
    setDeleteConfirmOpen(false);
    navigate(-1);
  };

  //========================
  //STEP4 렌더
  //========================
  return (
    <div className="bg-white px-5 pt-6 pb-24">
      {/*헤더 아래 목표 표시(중앙)*/}
      <div className="mb-6 flex items-center justify-center gap-2">
        <FlagSvg className="h-4 w-4" style={{ color: goalColor }} />
        <span className="text-[12px] font-semibold text-[#3A3A3A]">{goalName}</span>
      </div>

      {/*폴더 메뉴(ActionMenu) - 점3개 클릭은 AppHeaderAuto가 이벤트만 쏘고, 여기가 띄움*/}
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
        //헤더 기준 우상단에 뜨는 느낌으로(대충) 맞춤. 필요하면 값만 바꾸면 됨.
        className="right-5 top-25"
      />

      {/*========================
        진행 섹션
      ========================*/}
      <div className="flex gap-3">
        {/*왼쪽 레일*/}
        <div className="flex w-4 flex-col items-center">
          <FProgressSvg className="h-6 w-6" />
          <div className="mt-2 flex-1 w-px border-l border-dotted border-[#B0E7E3]" />
        </div>

        {/*오른쪽 컨텐츠*/}
        <div className="min-w-0 flex-1">
          {/*섹션 헤더*/}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#00857D]">
              <span>{`진행 (${progressCount}개)`}</span>
            </div>

            {/*오른쪽 회색 + (요구 svg)*/}
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

          {/*리스트 박스*/}
          {progressCount === 0 ? (
            <button
              type="button"
              onClick={goTaskAdd}
              className={[
                "flex w-full items-center justify-start gap-3 rounded-lg bg-[#E6F7F6] py-7 pl-5",
                "hover:bg-[#D9F2F0] active:bg-[#CDEDEA]",
              ].join(" ")}
            >
              <PlusGreenIcon />
              <span className="text-[13px] font-semibold leading-[150%] text-[#00857D]">
                할 일을 추가하세요
              </span>
            </button>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#00B1A6] bg-white">
              <div className="divide-y divide-[#B0E7E3]">
                {progressTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    draggable
                    onDragStart={() => onDragStart(t.id, "progress")}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropOnItem(t.id, "progress")}
                    onClick={() => setOpenTaskId(t.id)}
                    className="flex w-full items-center justify-between px-4 py-6 text-left hover:bg-green-light-hover active:bg-green-light-active"
                  >
                    {/*왼쪽*/}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <MenuGreenSvg className="h-[11.25px] w-3" />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold leading-[150%] text-[#2C2C2C]">
                          {t.title}
                        </div>
                      </div>
                    </div>

                    {/*오른쪽*/}
                    <div className="flex items-center gap-2">
                      <span className="flex h-5.5 w-5.5 items-center justify-center rounded-xs bg-[#00B1A6] text-[12px] font-semibold leading-[120%] text-white">
                        {t.priority}
                      </span>

                      <span className="flex h-5.5 w-13 items-center justify-center rounded-[3px] border border-[#00B1A6] text-[12px] font-semibold text-[#00B1A6]">
                        {formatDuration(t.durationMinutes)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/*========================
        완료 섹션
      ========================*/}
      {doneCount > 0 && (
        <div className="mt-8 flex gap-3">
          {/*왼쪽 레일*/}
          <div className="flex w-4 flex-col items-center">
            <FDoneSvg className="h-4 w-4" />
            <div className="mt-2 flex-1 w-px border-l border-dotted border-[#FFE7B0]" />
          </div>

          {/*오른쪽 컨텐츠*/}
          <div className="min-w-0 flex-1">
            {/*섹션 헤더*/}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#F7941D]">
                <span>{`완료 (${doneCount}개)`}</span>
              </div>

              {/*완료 섹션 오른쪽은 + 없음(스크린샷 기준) */}
              <div className="h-7 w-7" />
            </div>

            <div className="overflow-hidden rounded-lg border border-[#F7941D] bg-white">
              <div className="divide-y divide-[#FFE7B0]">
                {doneTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    draggable
                    onDragStart={() => onDragStart(t.id, "done")}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropOnItem(t.id, "done")}
                    onClick={() => setOpenTaskId(t.id)}
                    className="flex w-full items-center justify-between px-4 py-6 text-left hover:bg-yellow-light-hover active:bg-yellow-light-active"
                  >
                    {/*왼쪽*/}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <MenuYellowSvg className="h-[11.25px] w-3" />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold leading-[150%] text-[#B0B0B0] line-through">
                          {t.title}
                        </div>
                      </div>
                    </div>

                    {/*오른쪽*/}
                    <div className="flex items-center gap-2">
                      <span className="flex h-5.5 w-5.5 items-center justify-center rounded-xs bg-[#F7941D] text-[12px] font-semibold leading-[120%] text-white">
                        {t.priority}
                      </span>

                      <span className="flex h-5.5 w-13 items-center justify-center rounded-[3px] border border-[#F7941D] text-[12px] font-semibold text-[#F7941D]">
                        {formatDuration(t.durationMinutes)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*========================
        할 일 정보 모달
      ========================*/}
      {openTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-4 pb-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalPanelRef}
            className="w-full max-w-105 rounded-[14px] bg-white p-6 shadow-[0_0_10px_0_rgba(15,15,15,0.04)]"
          >
            {/*모달 헤더*/}
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-normal text-[#00B1A6]">할 일 정보</div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-6 w-6 place-items-center rounded-md text-[#767676] hover:bg-black/5 active:bg-black/10"
                aria-label="close"
              >
                <span className="text-[18px] leading-none">×</span>
              </button>
            </div>

            {/*시간 정보(타임블록 미구현이면 - )*/}
            <div className="mt-5 text-center text-[28px] font-semibold leading-normal text-gray-700">
              {"-"}
            </div>

            {/*정보 행*/}
            <div className="mt-6 space-y-3">
              {/*이름*/}
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-normal text-[#767676]">이름</div>
                <button
                  type="button"
                  onClick={goEditStep1}
                  className="group flex items-center gap-2 rounded-md px-2 py-1 text-right text-[14px] font-semibold text-gray-700 hover:bg-black/5 active:bg-black/10"
                >
                  <span className="max-w-55 truncate">{openTask.title}</span>
                  <NextDarkSvg className="h-3.5 w-3.5" />
                </button>
              </div>

              {/*예상 소요 시간*/}
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-normal text-[#767676]">예상 소요 시간</div>
                <button
                  type="button"
                  onClick={goEditStep1}
                  className="group flex items-center gap-2 rounded-md px-2 py-1 text-right text-[14px] font-semibold text-gray-700 hover:bg-black/5 active:bg-black/10"
                >
                  <span>{formatDuration(openTask.durationMinutes)}</span>
                  <NextDarkSvg className="h-3.5 w-3.5" />
                </button>
              </div>

              {/*중요도*/}
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-normal text-[#767676]">중요도</div>
                <button
                  type="button"
                  onClick={goEditStep2}
                  className="group flex items-center gap-2 rounded-md px-2 py-1 text-right text-[14px] font-semibold text-gray-700 hover:bg-black/5 active:bg-black/10"
                >
                  <span>{openTask.priority}</span>
                  <NextDarkSvg className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/*하단 버튼 행*/}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={removeFromModal}
                className={[
                  "flex h-10.5 w-22 items-center justify-center rounded-md border border-[#C2C2C2] bg-white text-[14px] font-semibold text-[#3A3A3A]",
                  "hover:bg-red-100 hover:text-red-600 active:bg-red-200",
                ].join(" ")}
              >
                삭제
              </button>

              <button
                type="button"
                onClick={toggleDoneFromModal}
                className={[
                  "h-10.5 flex-1 rounded-md bg-[#F1F1F1] text-[14px] font-semibold text-[#767676]",
                  openTask.isDone
                    ? "hover:bg-gray-200 hover:text-gray-700 active:bg-gray-300"
                    : "hover:bg-green-100 hover:text-green-700 active:bg-green-200",
                ].join(" ")}
              >
                {openTask.isDone ? "완료 취소하기" : "할 일 완료하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*폴더 삭제 확인 모달*/}
      <ConfirmModal
        open={deleteConfirmOpen}
        title="폴더를 삭제하시겠어요?"
        description="폴더 내 할 일도 삭제돼요"
        cancelText="취소"
        confirmText="삭제"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={deleteFolder}
      />
    </div>
  );
}
