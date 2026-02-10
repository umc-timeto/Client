import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

type Props = {
  open: boolean;
  initialHours?: number;
  initialMinutes?: number;
  onClose: () => void;
  onConfirm: (hours: number, minutes: number) => void;
};

const ITEM_H = 38; //각 줄 높이(px)//휠 숫자 세로 간격
const VISIBLE_ROWS = 4; //휠 보이는 줄 수(위/중앙/아래)
const COL_H = ITEM_H * VISIBLE_ROWS; //휠 높이(px)
const CENTER_OFFSET = (COL_H - ITEM_H) / 2; //중앙 오프셋

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

//특정 index의 아이템이 중앙에 오도록 scrollTop 계산
function getScrollTopForIndex(idx: number) {
  return idx * ITEM_H;
}

//scrollTop에서 중앙 아이템 index 계산
function getIndexFromScrollTop(scrollTop: number, count: number) {
  const raw = Math.round(scrollTop / ITEM_H);
  return clamp(raw, 0, count - 1);
}

export default function TimePickerModel({
  open,
  initialHours = 0,
  initialMinutes = 0,
  onClose,
  onConfirm,
}: Props) {
  //시간/분 선택 리스트
  const hoursList = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);
  const minutesList = useMemo(() => [0, 10, 20, 30, 40, 50], []);

  //현재 선택 상태
  const [h, setH] = useState(initialHours);
  const [m, setM] = useState(initialMinutes);

  //휠 스크롤 ref
  const hourRef = useRef<HTMLDivElement | null>(null);
  const minRef = useRef<HTMLDivElement | null>(null);

  //열릴 때 초기 위치를 중앙으로 이동
  useEffect(() => {
    if (!open) return;

    setH(initialHours);
    setM(initialMinutes);

    requestAnimationFrame(() => {
      const hi = hoursList.indexOf(initialHours);
      const mi = minutesList.indexOf(initialMinutes);

      if (hourRef.current && hi >= 0) {
        hourRef.current.scrollTo({ top: getScrollTopForIndex(hi), behavior: "auto" });
      }
      if (minRef.current && mi >= 0) {
        minRef.current.scrollTo({ top: getScrollTopForIndex(mi), behavior: "auto" });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  //모달 열려있는 동안 배경 스크롤 방지
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  //0시간 0분이면 완료 비활성
  const canConfirm = !(h === 0 && m === 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6">
      {/*배경 오버레이*/}
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="close modal overlay"
        onClick={onClose}
      />

      {/*모달 박스*/}
      <div className="relative w-full max-w-85.75 h-75.25 rounded-[14px] bg-white p-6 shadow-[0_0_10px_0_rgba(15,15,15,0.08)] flex flex-col">
        {/*헤더*/}
        <div className="flex items-center justify-between">
          <div className="title-16-semibold text-gray-700">소요 시간 선택</div>
          <button type="button" onClick={onClose} className="text-gray-300 text-xl">
            ✕
          </button>
        </div>

        {/*바디:휠 영역*/}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center gap-0">
            <WheelColumn
              label="hour"
              value={h}
              items={hoursList}
              containerRef={hourRef}
              onChange={(next) => setH(next)}
            />

            <div className="font-pretendard text-[20px] font-bold text-gray-700">:</div>

            <WheelColumn
              label="min"
              value={m}
              items={minutesList}
              containerRef={minRef}
              onChange={(next) => setM(next)}
            />
          </div>
        </div>

        {/*푸터:완료 버튼*/}
        <div className="mt-auto pt-4">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(h, m)}
            className={[
              "text-[14px] w-full rounded-xl py-4 body-14-medium font-semibold",
              canConfirm ? "bg-[#f1f1f1] text-gray-600" : "bg-gray-100 text-gray-300",
            ].join(" ")}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

type WheelColumnProps<T extends number> = {
  label: string;
  value: T;
  items: T[];
  containerRef: RefObject<HTMLDivElement | null>;
  onChange: (v: T) => void;
};

function WheelColumn<T extends number>({
  label,
  value,
  items,
  containerRef,
  onChange,
}: WheelColumnProps<T>) {
  //스크롤로 중앙 아이템 계산해서 value 갱신
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = getIndexFromScrollTop(el.scrollTop, items.length);
        const next = items[idx];
        if (next !== value) onChange(next);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [containerRef, items, onChange, value]);

  return (
    <div className="relative overflow-hidden">
      {/*중앙 회색 박스*/}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-sm"
        style={{ width: 50, height: 40, background: "#F1F1F1" }}
      />

      {/*위/아래 그라데이션*/}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 h-6 bg-linear-to-b from-white to-white/0" />
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-20 h-6 bg-linear-to-t from-white to-white/0" />

      {/*휠 스크롤*/}
      <div
        ref={containerRef}
        className="relative z-10 w-18 overflow-y-auto no-scrollbar snap-y snap-mandatory"
        style={{
          height: COL_H,
          paddingTop: CENTER_OFFSET,
          paddingBottom: CENTER_OFFSET,
          scrollPaddingTop: CENTER_OFFSET,
          scrollPaddingBottom: CENTER_OFFSET,
        }}
      >
        {items.map((it, idx) => {
          const selected = it === value;

          return (
            <button
              key={`${label}-${it}`}
              type="button"
              onClick={() => {
                const el = containerRef.current;
                if (!el) return;
                //클릭하면 자동으로 중앙 박스로 들어오게 스크롤
                el.scrollTo({ top: getScrollTopForIndex(idx), behavior: "smooth" });
                onChange(it);
              }}
              className={[
                "w-full snap-center flex items-center justify-center",
                "font-pretendard text-[20px]",
                selected ? "font-semibold text-gray-700" : "font-medium text-gray-300",
              ].join(" ")}
              style={{ height: ITEM_H }}
            >
              {pad2(it)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
