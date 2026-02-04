import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  initialHours?: number;
  initialMinutes?: number;
  onClose: () => void;
  onConfirm: (hours: number, minutes: number) => void;
};

const ITEM_H = 44; //각 줄 높이(px)
const COL_H = 220; //휠 컬럼 높이(px) - 기존 그대로
const CENTER_OFFSET = COL_H / 2 - ITEM_H / 2; //중앙 선택 박스가 되게 만드는 오프셋

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

//특정 index의 아이템이 "중앙(회색 박스)"에 오도록 scrollTop 계산
function getScrollTopForIndex(idx: number) {
  return idx * ITEM_H;
}

//현재 scrollTop에서 "중앙에 걸린 아이템 index" 계산
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
  const hoursList = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);
  const minutesList = useMemo(() => [0, 10, 20, 30, 40, 50], []);

  const [h, setH] = useState(initialHours);
  const [m, setM] = useState(initialMinutes);

  const hourRef = useRef<HTMLDivElement | null>(null);
  const minRef = useRef<HTMLDivElement | null>(null);

  //열릴 때 초기 위치를 "중앙 기준"으로 맞추기
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

  const canConfirm = !(h === 0 && m === 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="close modal overlay"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[520px] rounded-[16px] bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="title-16-semibold text-gray-700">소요 시간 선택</div>
          <button type="button" onClick={onClose} className="text-gray-300 text-xl">
            ✕
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <WheelColumn
            label="hour"
            value={h}
            items={hoursList}
            containerRef={hourRef}
            onChange={(next) => setH(next)}
          />

          <div className="font-pretendard text-[18px] font-medium text-gray-700">:</div>

          <WheelColumn
            label="min"
            value={m}
            items={minutesList}
            containerRef={minRef}
            onChange={(next) => setM(next)}
          />
        </div>

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(h, m)}
          className={[
            "mt-6 w-full rounded-[12px] py-4 body-14-medium",
            canConfirm ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-300",
          ].join(" ")}
        >
          완료
        </button>
      </div>
    </div>
  );
}

type WheelColumnProps<T extends number> = {
  label: string;
  value: T;
  items: T[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (v: T) => void;
};

function WheelColumn<T extends number>({
  label,
  value,
  items,
  containerRef,
  onChange,
}: WheelColumnProps<T>) {
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
    <div className="relative">
      {/*중앙 선택 박스(회색)*/}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[44px] rounded-[10px] bg-gray-200/40 z-0" />

      {/*위/아래 뽀얀 그라데이션(경계 흐림)*/}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-white to-white/0" />
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-t from-white to-white/0" />

      <div
        ref={containerRef}
        className="relative z-10 h-[220px] w-[96px] overflow-y-auto no-scrollbar snap-y snap-mandatory"
        style={{
          //중앙 정렬을 위한 패딩(더미아이템 없이 중앙에 멈추게)
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
                "h-[44px] w-full snap-center flex items-center justify-center",
                "font-pretendard text-[18px] font-medium",
                selected ? "text-gray-700" : "text-gray-300",
              ].join(" ")}
            >
              {pad2(it)}
            </button>
          );
        })}
      </div>
    </div>
  );
}