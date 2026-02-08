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

  //URL 쿼리로 step 제어 (1: 입력 / 2: 중요도)
  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = step === 2 ? 2 : 1; //step은 1/2만 허용

  //STEP1 입력값
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  //STEP2 선택값
  const [priority, setPriority] = useState<TaskPriority | null>(null);

  //시간 선택 모달
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  //표시용(예: "1시간 20분", "20분")
  const durationText = useMemo(() => formatDuration(hours, minutes), [hours, minutes]);

  //STEP1 라벨/라인 강조용
  const titleActive = title.trim().length > 0;
  const durationActive = durationText.length > 0;

  //헤더(AppHeaderAuto)에서 다음/저장 버튼 활성화 판단용
  const canNext = titleActive && durationActive;
  const canSave = priority !== null;

  //헤더(AppHeaderAuto)가 참조하는 canNext/canSave를 URL 쿼리에 반영
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (!next.get("step")) next.set("step", "1");

    //step에 따라 헤더가 보는 값 분기
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
  //STEP 1: 할 일 입력
  //========================
  if (safeStep < 2) {
    //피그마값(입력/선택 텍스트): #0F0F0F / 22px / 600 / H=25
    const valueTextCls =
      "font-pretendard text-[22px] font-semibold leading-[25px] text-[#0F0F0F]";

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

        {/*할 일 이름 입력 블록*/}
        <div className="mt-10">
          {/*라벨:입력값 유무에 따라 색 반응형*/}
          <div
            className={[
              "font-pretendard text-[13px] font-medium leading-normal",
              titleActive ? "text-gray-700" : "text-gray-300",
            ].join(" ")}
          >
            할 일 이름
          </div>

          {/*입력 영역:밑줄(border)만 색 반응형, 입력 텍스트는 항상 #0F0F0F*/}
          <div
            className={[
              "mt-3 w-full border-b pb-2", //pb로 텍스트가 라인 위에 떠보이게
              titleActive ? "border-gray-700" : "border-gray-200",
            ].join(" ")}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={[
                "w-full bg-transparent outline-none",
                valueTextCls, //입력되는 텍스트는 항상 검정 고정(피그마값)
              ].join(" ")}
              style={{ height: 25 }}
            />
          </div>
        </div>

        {/*예상 소요 시간 선택 블록*/}
        <div className="mt-10">
          {/*라벨:선택값 유무에 따라 색 반응형*/}
          <div
            className={[
              "font-pretendard text-[13px] font-medium leading-normal",
              durationActive ? "text-gray-700" : "text-gray-300",
            ].join(" ")}
          >
            예상 소요 시간
          </div>

          {/*선택 버튼:밑줄(border)만 색 반응형, 표시 텍스트는 항상 #0F0F0F*/}
          <button
            type="button"
            onClick={() => setTimeModalOpen(true)}
            className={[
              "mt-3 w-full text-left border-b pb-2", //pb로 텍스트가 라인 위에 떠보이게
              durationActive ? "border-gray-700" : "border-gray-200",
            ].join(" ")}
          >
            <span className="block" style={{ height: 25 }}>
              <span className={valueTextCls}>{durationText || " "}</span>
            </span>
          </button>
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
                //한 줄 row (피그마: W335 / H54 / padding 13 10 / radius 8)
                "w-full h-13.5 px-2.5 py-3.25 rounded-lg",
                "flex items-center justify-between",
                //선택 상태 배경 (피그마: #F1F1F1)
                selected ? "bg-[#F1F1F1]" : "bg-transparent",
              ].join(" ")}
            >
              {/*항목 텍스트*/}
              <span className="font-pretendard text-[16px] font-semibold leading-normal text-gray-700">
                {p}
              </span>

              {/*체크 인디케이터*/}
              <span
                className={[
                  "flex h-4.5 w-4.5 items-center justify-center rounded-[20px] border",
                  selected ? "border-[#B0B0B0] bg-[#B0B0B0]" : "border-[#B0B0B0] bg-transparent",
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
