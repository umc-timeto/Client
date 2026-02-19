//C:\Users\tndus\Client\src\pages\TaskPage\TaskPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import TimePickerModel from "@/components/TimePickerModel";
import UnderlineBox from "@/components/UnderlineBox";

import type { TaskPriority } from "@/types/task";
import { apiPriorityToUi, uiPriorityToApi, apiDurationToMinutes, minutesToApiDuration } from "@/types/task";

import { useHeaderActions } from "@/contexts/HeaderActionContext";
import { taskApi } from "@/apis/TaskPage/task.api";

type TaskDraft = {
  folderId: string;
  title: string;
  durationMinutes: number;
  priority: TaskPriority;
};

function formatDuration(hours: number, minutes: number) {
  if (hours === 0 && minutes === 0) return "";
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export default function TaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setOnComplete } = useHeaderActions();

  //========================
  //쿼리 파라미터(폴더/리턴/모드)
  //========================
  const folderId = searchParams.get("folderId") ?? "";
  const folderName = searchParams.get("folderName") ?? "폴더";
  const taskId = searchParams.get("taskId") ?? null;
  const returnTo = searchParams.get("return") ?? null;

  const folderIdNum = Number(folderId);

  //========================
  //✅ goal 정보도 같이 들고 다니기(쿼리 + state)
  //========================
  const goalIdFromState = (location.state as { goalId?: string } | null)?.goalId;
  const goalNameFromState = (location.state as { goalName?: string } | null)?.goalName;
  const goalColorFromState = (location.state as { goalColor?: string } | null)?.goalColor;

  const goalIdFromQuery = searchParams.get("goalId") ?? undefined;
  const goalNameFromQuery = searchParams.get("goalName") ?? undefined;
  const goalColorFromQuery = searchParams.get("goalColor") ?? undefined;

  const goalId = goalIdFromState ?? goalIdFromQuery ?? null;
  const goalName = goalNameFromState ?? goalNameFromQuery ?? undefined;
  const goalColor = goalColorFromState ?? goalColorFromQuery ?? undefined;

  //========================
  //모달 오픈 쿼리 키
  //========================
  const OPEN_TASK_QUERY_KEY = "openTaskId";

  //========================
  //step
  //========================
  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = step === 2 ? 2 : 1;

  //========================
  //입력값
  //========================
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  //========================
  //선택값
  //========================
  const [priority, setPriority] = useState<TaskPriority | null>(null);

  //========================
  //모달
  //========================
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  //========================
  //프리필 완료 여부
  //========================
  const [prefilled, setPrefilled] = useState(false);

  //========================
  //✅ 폴더 복귀 URL(항상 goal 포함)
  //========================
  const buildFolderBaseUrl = useCallback(() => {
    const q = new URLSearchParams();
    q.set("folderId", folderId);
    q.set("folderName", String(folderName));
    if (goalId) q.set("goalId", goalId);
    if (goalName) q.set("goalName", goalName);
    if (goalColor) q.set("goalColor", goalColor);
    return `/folder?${q.toString()}`;
  }, [folderId, folderName, goalId, goalName, goalColor]);

  const buildFolderReturnUrl = useCallback(
    (openId: string) => {
      const q = new URLSearchParams();
      q.set("folderId", folderId);
      q.set("folderName", String(folderName));
      if (goalId) q.set("goalId", goalId);
      if (goalName) q.set("goalName", goalName);
      if (goalColor) q.set("goalColor", goalColor);
      q.set(OPEN_TASK_QUERY_KEY, openId);
      return `/folder?${q.toString()}`;
    },
    [folderId, folderName, goalId, goalName, goalColor],
  );

  //========================
  //편집모드 프리필
  //========================
  useEffect(() => {
    if (!folderId || !Number.isFinite(folderIdNum)) {
      navigate("/home", { replace: true });
      return;
    }

    if (!taskId) {
      setPrefilled(true);
      return;
    }

    if (prefilled) return;

    (async () => {
      try {
        const todoId = Number(taskId);
        if (!Number.isFinite(todoId)) {
          navigate(buildFolderBaseUrl(), { replace: true });
          return;
        }

        const dto = await taskApi.getTodo(todoId);

        setTitle(dto.name ?? "");
        const total = apiDurationToMinutes(dto.duration ?? "");
        setHours(Math.floor(total / 60));
        setMinutes(total % 60);
        setPriority(apiPriorityToUi(dto.priority));

        setPrefilled(true);
      } catch (e) {
        console.error(e);
        navigate(buildFolderBaseUrl(), { replace: true });
      }
    })();
  }, [folderId, folderIdNum, taskId, prefilled, navigate, buildFolderBaseUrl]);

  const durationText = useMemo(() => formatDuration(hours, minutes), [hours, minutes]);
  const titleActive = title.trim().length > 0;
  const durationActive = durationText.length > 0;

  const canNext = titleActive && durationActive;
  const canSave = priority !== null;

  const durationMinutes = useMemo(() => hours * 60 + minutes, [hours, minutes]);

  const draft: TaskDraft | null = useMemo(() => {
    if (!canSave) return null;
    return { folderId, title: title.trim(), durationMinutes, priority: priority! };
  }, [canSave, folderId, title, durationMinutes, priority]);

  //========================
  //canNext/canSave 쿼리 반영(프리필 이후만)
  //========================
  useEffect(() => {
    if (!prefilled) return;

    const next = new URLSearchParams(searchParams);
    if (!next.get("step")) next.set("step", "1");

    if (safeStep >= 2) {
      next.delete("canNext");
      next.set("canSave", canSave ? "1" : "0");
    } else {
      next.delete("canSave");
      next.set("canNext", canNext ? "1" : "0");
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [prefilled, safeStep, canNext, canSave, searchParams, setSearchParams]);

  //========================
  //저장 동작 등록
  //========================
  useEffect(() => {
    const handleSave = async () => {
      if (safeStep < 2) return;
      if (!prefilled) return;
      if (!folderId || !Number.isFinite(folderIdNum)) return;

      try {
        //========================
        //edit: 폴더 복귀 시 openTaskId 붙여서 모달 유지(O)
        //========================
        if (taskId) {
          if (!draft) return;
          const todoId = Number(taskId);
          if (!Number.isFinite(todoId)) return;

          await taskApi.updateTodo(todoId, {
            name: draft.title,
            priority: uiPriorityToApi(draft.priority),
            duration: minutesToApiDuration(draft.durationMinutes),
          });

          const to = returnTo === "folder" ? buildFolderReturnUrl(taskId) : buildFolderBaseUrl();
          navigate(to, {
            replace: true,
            state: { folderId, folderName, goalId, goalName, goalColor },
          });
          return;
        }

        //========================
        //create: 폴더 복귀 시 openTaskId 없이 그냥 폴더만(OX 모달)
        //========================
        if (!draft) return;

        await taskApi.addTodo(folderIdNum, {
          name: draft.title,
          priority: uiPriorityToApi(draft.priority),
          duration: minutesToApiDuration(draft.durationMinutes),
        });

        const to = buildFolderBaseUrl();
        navigate(to, {
          replace: true,
          state: { folderId, folderName, goalId, goalName, goalColor },
        });
      } catch (e) {
        console.error(e);
      }
    };

    setOnComplete(() => handleSave);
    return () => setOnComplete(null);
  }, [
    setOnComplete,
    safeStep,
    prefilled,
    taskId,
    draft,
    returnTo,
    navigate,
    folderId,
    folderName,
    folderIdNum,
    buildFolderReturnUrl,
    buildFolderBaseUrl,
    goalId,
    goalName,
    goalColor,
  ]);

  //========================
  //STEP1
  //========================
  if (safeStep < 2) {
    return (
      <div className="bg-white px-5 pt-8">
        <h1 className="text-[24px] font-bold leading-[33.6px] text-black">
          매우 작은 단위의
          <br />
          할 일을 만들어주세요
        </h1>

        <p className="mt-2 font-pretendard text-[14px] font-medium leading-normal text-green-normal">
          부담 없이 도전할 수 있는 일부터 시작해요
        </p>

        <div className="mt-10">
          <UnderlineBox label="할 일 이름" active={titleActive} mode="input" inputValue={title} onInputChange={setTitle} />
        </div>

        <div className="mt-10">
          <UnderlineBox
            label="예상 소요 시간"
            active={durationActive}
            mode="button"
            valueText={durationText}
            onClick={() => setTimeModalOpen(true)}
          />
        </div>

        <TimePickerModel
          open={timeModalOpen}
          initialHours={hours}
          initialMinutes={minutes}
          onClose={() => setTimeModalOpen(false)}
          onConfirm={(h, m) => {
            setHours(h);
            setMinutes(m);
            setTimeModalOpen(false);
          }}
        />
      </div>
    );
  }

  //========================
  //STEP2
  //========================
  return (
    <div className="bg-white px-5 pt-8">
      <h1 className="text-[24px] font-bold leading-[33.6px] text-black">
        이 할 일의
        <br />
        중요도를 선택해주세요
      </h1>

      <p className="mt-2 font-pretendard text-[14px] font-medium leading-normal text-green-normal">
        중요한 일부터 차근차근 해결해요
      </p>

      <div className="mt-12 flex flex-col gap-4">
        {(["상", "중", "하"] as const).map((p) => {
          const selected = priority === p;

          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={[
                "w-full h-13.5 px-2.5 py-3.25 rounded-lg",
                "flex items-center justify-between",
                selected ? "bg-[#F1F1F1]" : "bg-transparent",
              ].join(" ")}
            >
              <span className="font-pretendard text-[16px] font-semibold leading-normal text-gray-700">{p}</span>

              <span
                className={[
                  "flex h-4.5 w-4.5 items-center justify-center rounded-[20px] border",
                  selected ? "border-[#B0B0B0] bg-[#B0B0B0]" : "border-[#B0B0B0] bg-transparent",
                ].join(" ")}
              >
                {selected ? <span className="text-gray-100 text-[12px] leading-none">✓</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
