import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";
import type { ColorKey } from "@/constants/timeBlockCreateStore";

import SelectRow from "@/pages/TimeBlockPage/components/TimeBlockCreate/SelectRow";
import ConfirmModal from "@/components/ConfirmModal";

import { taskApi } from "@/apis/TimeBlockPage/task";
import { todoApi } from "@/apis/TimeBlockPage/todo";
import { timeBlockSaveApi } from "@/apis/TimeBlockPage/timeBlockSave";
import { timeBlockDayApi } from "@/apis/TimeBlockPage/timeBlockDay";

const levelLabelMap: Record<string, string> = { high: "상", mid: "중", low: "하" };

type TodoState = "progress" | "complete";
type TodoPriority = "HIGH" | "MEDIUM" | "LOW";

type UnblockedTodoItem = {
  todoId: number;
  name: string;
  duration?: string;
  priority?: TodoPriority;
  state?: TodoState;
  startAt?: string | null;
};

const priorityToLevel = (p?: TodoPriority): "high" | "mid" | "low" => {
  if (p === "HIGH") return "high";
  if (p === "LOW") return "low";
  return "mid";
};

const durationToMinutes = (duration?: string): number | undefined => {
  const raw = String(duration ?? "").trim();
  if (!raw) return undefined;

  const iso = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (iso) {
    const h = iso[1] ? Number(iso[1]) : 0;
    const m = iso[2] ? Number(iso[2]) : 0;
    const total = h * 60 + m;
    return Number.isFinite(total) ? total : undefined;
  }

  const hMatch = raw.match(/(\d+)\s*H/i);
  const mMatch = raw.match(/(\d+)\s*M/i);
  if (hMatch || mMatch) {
    const h = hMatch ? Number(hMatch[1]) : 0;
    const m = mMatch ? Number(mMatch[1]) : 0;
    const total = h * 60 + m;
    return Number.isFinite(total) ? total : undefined;
  }

  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const colorVar = (key: ColorKey, tone: "nomal" | "light") => `var(--color-folder-${key}-${tone})`;

const pad2 = (n: number) => String(n).padStart(2, "0");
const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

const formatStartAt = (dateYmd: string, base: Date) => {
  const ymd = isYmd(dateYmd)
    ? dateYmd
    : `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
  return `${ymd}T${pad2(base.getHours())}:${pad2(base.getMinutes())}:00`;
};

export default function TimeBlockCreateTaskPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const pickedGoal = useTimeBlockCreateStore((s) => s.pickedGoal);
  const pickedFolder = useTimeBlockCreateStore((s) => s.pickedFolder);
  const pickedTask = useTimeBlockCreateStore((s) => s.pickedTask);
  const setTask = useTimeBlockCreateStore((s) => s.setTask);

  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ todoId: number; startAt: string } | null>(null);

  const dateYmd = (() => {
    const d =
      searchParams.get("date") ??
      searchParams.get("w") ??
      sessionStorage.getItem("timetto_timeblock_date") ??
      "";
    if (isYmd(d)) return d;

    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  })();

  const dateQuery = `?date=${encodeURIComponent(dateYmd)}`;

  const folderId = useMemo(() => {
    if (!pickedFolder) return null;

    const pf = pickedFolder as unknown as { id?: string | number; folderId?: string | number };
    const v = pf.folderId ?? pf.id;
    if (v === null || v === undefined) return null;

    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [pickedFolder]);

  const { data: blocksForSelectedDay = [] } = useQuery({
    queryKey: ["timeblocks", "day", dateYmd],
    queryFn: () => timeBlockDayApi.getTimeBlocksByDay(dateYmd),
    staleTime: 30_000,
    enabled: Boolean(dateYmd),
  });
  const hasAnyBlockInSelectedDay = (blocksForSelectedDay ?? []).length > 0;

  const { data: unblockedTodos = [], isLoading } = useQuery({
    queryKey: ["todos", "unblocked", "withDetail", folderId],
    queryFn: async () => {
      if (folderId === null) return [];

      const base = (await taskApi.getUnblockedTodoList(folderId)) as UnblockedTodoItem[];

      const merged = await Promise.all(
        base.map(async (t) => {
          try {
            const d = await todoApi.getTodoDetail(t.todoId);
            return {
              ...t,
              name: d.name ?? t.name,
              duration: d.duration ?? t.duration,
              priority: d.priority ?? t.priority,
              state: d.state ?? t.state,
              startAt: d.startAt ?? t.startAt,
            } as UnblockedTodoItem;
          } catch {
            return t;
          }
        })
      );

      return merged.filter((t) => {
        const s = (t as UnblockedTodoItem).startAt;
        return s === null || s === undefined || String(s).trim() === "";
      });
    },
    enabled: folderId !== null,
    staleTime: 30_000,
  });

  const tasks = useMemo(() => {
    if (!pickedGoal) return [];

    const goalColorKey: ColorKey = (pickedGoal.colorKey ?? ("yellow" as ColorKey)) as ColorKey;

    return (unblockedTodos ?? []).map((t) => {
      const level = priorityToLevel(t.priority);
      const minutes = durationToMinutes(t.duration);

      return {
        id: String(t.todoId),
        todoId: t.todoId,
        folderId: folderId ?? 0,
        title: t.name,
        minutes,
        level,
        colorKey: goalColorKey,
      };
    });
  }, [unblockedTodos, pickedGoal, folderId]);

  const trySave = async (todoId: number, startAt: string): Promise<"ok" | "error"> => {
    setSaving(true);
    try {
      await timeBlockSaveApi.saveTimeBlock(todoId, { startAt });
      return "ok";
    } catch {
      return "error";
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = async () => {
      if (!pickedTask) return;

      const todoId = (pickedTask as any)?.todoId ?? Number((pickedTask as any)?.id);
      if (!Number.isFinite(todoId)) return;

      const startAt = formatStartAt(dateYmd, new Date());

      if (hasAnyBlockInSelectedDay) {
        setPendingSave({ todoId, startAt });
        setConfirmOpen(true);
        return;
      }

      const r = await trySave(todoId, startAt);
      if (r === "ok") {
        queryClient.invalidateQueries({ queryKey: ["timeblocks", "day", dateYmd] });
        navigate(`/timeblock?date=${encodeURIComponent(dateYmd)}`, { replace: true });
      }
    };

    window.addEventListener("timeblockCreate:save", handler as EventListener);
    return () => window.removeEventListener("timeblockCreate:save", handler as EventListener);
  }, [pickedTask, dateYmd, navigate, hasAnyBlockInSelectedDay, queryClient]);

  if (!pickedGoal) return <Navigate to={`/timeblock/create/goal${dateQuery}`} replace />;
  if (!pickedFolder) return <Navigate to={`/timeblock/create/folder${dateQuery}`} replace />;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white px-5.5 pt-10 flex items-center justify-center text-gray-400">
        불러오는 중...
      </div>
    );
  }

  const goalColorKey: ColorKey = (pickedGoal.colorKey ?? ("yellow" as ColorKey)) as ColorKey;

  const folderTitle =
    (pickedFolder as unknown as { title?: string; name?: string }).title ??
    (pickedFolder as unknown as { title?: string; name?: string }).name ??
    "";

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingSave(null);
  };

  const confirmAutoAppend = async () => {
    if (!pendingSave) return;

    const { todoId, startAt } = pendingSave;

    setConfirmOpen(false);
    setPendingSave(null);

    const r = await trySave(todoId, startAt);
    if (r === "ok") {
      queryClient.invalidateQueries({ queryKey: ["timeblocks", "day", dateYmd] });
      navigate(`/timeblock?date=${encodeURIComponent(dateYmd)}`, { replace: true });
    }
  };

  return (
    <>
      <div
        className="mt-1 text-[13px] flex justify-center items-center text-center"
        style={{ color: colorVar(goalColorKey, "nomal") }}
      >
        {folderTitle}
      </div>

      <div className="min-h-dvh bg-white px-5.5 pt-10">
        {saving ? <div className="mb-4 text-[13px] text-center text-gray-400">저장 중...</div> : null}

        <div className="mt-4 space-y-2">
          {tasks.map((t) => {
            const ck = t.colorKey;

            return (
              <SelectRow
                key={t.id}
                title={t.title}
                sub={t.minutes ? `${t.minutes}분 소요 예정` : undefined}
                selected={pickedTask?.id === t.id}
                onClick={() => setTask(pickedTask?.id === t.id ? null : t)}
                left={
                  <div
                    className="flex w-5.5 h-5.5 px-1.75 py-1.25 items-center justify-center rounded-xs text-[12px] font-semibold text-white"
                    style={{ backgroundColor: colorVar(ck, "nomal") }}
                  >
                    {levelLabelMap[t.level ?? "mid"]}
                  </div>
                }
                selectedBgClassName=""
                selectedBgStyle={{ backgroundColor: colorVar(ck, "light") }}
                right={
                  pickedTask?.id === t.id ? (
                    <div
                      className="flex h-5.5 w-5.5 items-center justify-center rounded-full"
                      style={{ backgroundColor: colorVar(ck, "nomal") }}
                    >
                      <span className="text-caption-12 font-semibold text-white">✓</span>
                    </div>
                  ) : null
                }
              />
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="선택한 시간에 다른 할 일이 있어요"
        cancelText="취소"
        confirmText="확인"
        onCancel={closeConfirm}
        onConfirm={confirmAutoAppend}
        variant="timeblockConflict"
      />
    </>
  );
}