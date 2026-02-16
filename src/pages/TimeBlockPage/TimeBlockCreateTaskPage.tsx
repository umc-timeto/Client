import { useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { mockTasks } from "@/pages/TimeBlockPage/data/mockTimeBlockCreate";
import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";
import SelectRow from "@/pages/TimeBlockPage/components/TimeBlockCreate/SelectRow";

const levelLabelMap: Record<string, string> = { high: "상", mid: "중", low: "하" };

const colorVar = (key: string, tone: "nomal" | "light") =>
  `var(--color-folder-${key}-${tone})`;

export default function TimeBlockCreateTaskPage() {

  const pickedGoal = useTimeBlockCreateStore((s) => s.pickedGoal);
  const pickedFolder = useTimeBlockCreateStore((s) => s.pickedFolder);
  const pickedTask = useTimeBlockCreateStore((s) => s.pickedTask);
  const setTask = useTimeBlockCreateStore((s) => s.setTask);

  const tasks = useMemo(() => {
    if (!pickedFolder) return [];
    return mockTasks.filter((t) => t.folderId === pickedFolder.id);
  }, [pickedFolder]);

  if (!pickedGoal) return <Navigate to="/timeblock/create/goal" replace />;
  if (!pickedFolder) return <Navigate to="/timeblock/create/folder" replace />;

  const goalColorKey = pickedGoal.colorKey!;

  useEffect(() => {
    const handler = () => {
      if (!pickedTask) return;
    };

    window.addEventListener("timeblockCreate:save", handler as EventListener);
    return () =>
      window.removeEventListener(
        "timeblockCreate:save",
        handler as EventListener
      );
  }, [pickedTask]);

  return (
    <>
    <div
        className="mt-1 text-[13px] flex justify-center items-center text-center"
        style={{ color: colorVar(goalColorKey, "nomal") }}
      >
        {pickedFolder.title}
      </div>
    <div className="min-h-dvh bg-white px-5.5 pt-10">
      

      <div className="mt-4 space-y-2">
        {tasks.map((t) => {
          const ck = t.colorKey!;

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
                  <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full" style={{ backgroundColor: colorVar(ck, "nomal") }}>
                    <span className="text-caption-12 font-semibold text-white">✓</span>
                  </div>
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  </>
);
}