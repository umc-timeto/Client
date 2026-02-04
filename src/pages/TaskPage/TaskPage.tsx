import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TimePickerModel from "@/components/TimePickerModel";
import type { TaskPriority } from "@/types/task";

function formatDuration(hours: number, minutes: number) {
  if (hours === 0 && minutes === 0) return "";
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export default function TaskPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = step === 2 ? 2 : 1; // 1/2로만 제한

  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [priority, setPriority] = useState<TaskPriority | null>(null);

  const [timeModalOpen, setTimeModalOpen] = useState(false);

  const durationText = useMemo(() => formatDuration(hours, minutes), [hours, minutes]);

  const canNext = title.trim().length > 0 && durationText.length > 0;
  const canSave = priority !== null;

  //헤더(AppHeaderAuto)가 보는 canNext/canSave를 쿼리로 업데이트
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canNext, canSave, safeStep]);

  //STEP 1
  if (safeStep < 2) {
    return (
      <div className="bg-white px-5 pt-8">
        <h1 className="title-20-semibold text-gray-700">
          매우 작은 단위의
          <br />
          할 일을 만들어주세요
        </h1>

        <p className="mt-2 body-14-regular text-gray-300">부담 없이 도전할 수 있는 일부터 시작해요</p>

        <div className="mt-10">
          <div className="body-14-medium text-gray-300">할 일 이름</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-3 w-full border-b border-gray-200 pb-3 body-16-medium text-gray-700 outline-none"
          />
        </div>

        <div className="mt-10">
          <div className="body-14-medium text-gray-300">예상 소요 시간</div>

          <button
            type="button"
            onClick={() => setTimeModalOpen(true)}
            className="mt-3 w-full border-b border-gray-200 pb-3 text-left"
          >
            {durationText ? (
              <span className="body-16-medium text-gray-700">{durationText}</span>
            ) : (
              <span className="body-16-medium text-gray-300"> </span>
            )}
          </button>
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

  //STEP 2 (중요도)
  return (
    <div className="bg-white px-5 pt-8">
      <h1 className="title-20-semibold text-gray-700">
        이 할 일의
        <br />
        중요도를 선택해주세요
      </h1>

      <p className="mt-2 body-14-regular text-gray-300">중요한 일부터 차근차근 해결해요</p>

      <div className="mt-12 flex flex-col gap-8">
        {(["상", "중", "하"] as const).map((p) => {
          const selected = priority === p;

          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className="flex items-center justify-between"
            >
              <span className="body-16-medium text-gray-700">{p}</span>

              <span
                className={[
                  "h-5 w-5 rounded-full border flex items-center justify-center",
                  selected ? "border-gray-700 bg-gray-700" : "border-gray-300",
                ].join(" ")}
              >
                {selected ? <span className="text-gray-100 text-xs">✓</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}