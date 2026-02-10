import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TimePickerModel from "@/components/TimePickerModel";
import UnderlineBox from "@/components/UnderlineBox";
import type { TaskCreateInput, TaskPriority } from "@/types/task";
import { MOCK_FOLDER_ID, mockTasks } from "./mock";
import { createTask, ensureMockSeed } from "@/api/taskApi";
import { useHeaderActions } from "@/contexts/HeaderActionContext";

function formatDuration(hours: number, minutes: number) {
  if (hours === 0 && minutes === 0) return "";
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export default function TaskPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setOnComplete } = useHeaderActions();

  //========================
  //앱 최초 1회: localStorage에 더미 시드
  //========================
  useEffect(() => {
    ensureMockSeed(mockTasks);
  }, []);

  //========================
  //URL 쿼리로 step 제어 (1: 입력 / 2: 중요도)
  //========================
  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = step === 2 ? 2 : 1; //step은 1/2만 허용

  //========================
  //STEP1 입력값
  //========================
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  //========================
  //STEP2 선택값
  //========================
  const [priority, setPriority] = useState<TaskPriority | null>(null);

  //========================
  //시간 선택 모달
  //========================
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  //========================
  //표시용(예: "1시간 20분", "20분")
  //========================
  const durationText = useMemo(
    () => formatDuration(hours, minutes),
    [hours, minutes]
  );

  //========================
  //STEP1 라벨/라인 강조용
  //========================
  const titleActive = title.trim().length > 0;
  const durationActive = durationText.length > 0;

  //========================
  //헤더(AppHeaderAuto) 버튼 활성화 판단용
  //========================
  const canNext = titleActive && durationActive;
  const canSave = priority !== null;

  //========================
  //POST로 보낼 payload(모양새)
  //========================
  const createInput: TaskCreateInput | null = useMemo(() => {
    if (!canSave) return null;
    return {
      folderId: MOCK_FOLDER_ID, //지금은 고정(폴더 페이지 완성 전)
      title: title.trim(),
      durationMinutes: hours * 60 + minutes,
      priority: priority!, //canSave면 null 아님
    };
  }, [canSave, hours, minutes, priority, title]);

  //========================
  //헤더(AppHeaderAuto)가 참조하는
  //canNext / canSave를 URL 쿼리에 반영
  //========================
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

  //========================
  //헤더 "저장" 버튼 동작 등록
  //========================
  useEffect(() => {
    const handleSave = async () => {
      //step2가 아니면 저장 동작 무시
      if (safeStep < 2) return;
      if (!createInput) return;

      await createTask(createInput);
      navigate("/folder");
    };

    //⚠️ 실행하지 말고, "함수 자체"만 등록
    setOnComplete(() => handleSave);

    //페이지 이탈 시 헤더 동작 해제
    return () => setOnComplete(null);
  }, [setOnComplete, safeStep, createInput, navigate]);

  //========================
  //STEP 1: 할 일 입력
  //========================
  if (safeStep < 2) {
    return (
      <div className="bg-white px-5 pt-8">
        {/*상단 안내 타이틀*/}
        <h1 className="text-[24px] font-bold leading-[33.6px] text-black">
          매우 작은 단위의
          <br />
          할 일을 만들어주세요
        </h1>

        {/*상단 안내 서브 텍스트*/}
        <p className="mt-2 font-pretendard text-[14px] font-medium leading-normal text-gray-300">
          부담 없이 도전할 수 있는 일부터 시작해요
        </p>

        {/*할 일 이름 입력*/}
        <div className="mt-10">
          <UnderlineBox
            label="할 일 이름"
            active={titleActive}
            mode="input"
            inputValue={title}
            onInputChange={(v) => setTitle(v)}
          />
        </div>

        {/*예상 소요 시간 선택*/}
        <div className="mt-10">
          <UnderlineBox
            label="예상 소요 시간"
            active={durationActive}
            mode="button"
            valueText={durationText}
            onClick={() => setTimeModalOpen(true)}
          />
        </div>

        {/*소요 시간 휠 모달*/}
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
  //STEP 2: 중요도 선택
  //========================
  return (
    <div className="bg-white px-5 pt-8">
      {/*상단 안내 타이틀*/}
      <h1 className="text-[24px] font-bold leading-[33.6px] text-black">
        이 할 일의
        <br />
        중요도를 선택해주세요
      </h1>

      {/*상단 안내 서브 텍스트*/}
      <p className="mt-2 font-pretendard text-[14px] font-medium leading-normal text-gray-300">
        중요한 일부터 차근차근 해결해요
      </p>

      {/*중요도 선택 리스트*/}
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
              <span className="font-pretendard text-[16px] font-semibold leading-normal text-gray-700">
                {p}
              </span>

              <span
                className={[
                  "flex h-4.5 w-4.5 items-center justify-center rounded-[20px] border",
                  selected
                    ? "border-[#B0B0B0] bg-[#B0B0B0]"
                    : "border-[#B0B0B0] bg-transparent",
                ].join(" ")}
              >
                {selected ? (
                  <span className="text-gray-100 text-[12px] leading-none">✓</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
