import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";


type DayCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);


const getMondayIndex = (d: Date) => {
  const js = d.getDay();
  return (js + 6) % 7;
};

const startOfWeekMonday = (d: Date) => {
  const base = startOfDay(d);
  return addDays(base, -getMondayIndex(base));
};


const toTimeLabel = (h: number) => {
  const hour = ((h % 24) + 24) % 24;
  return `${pad2(hour)}:00`;
};

const WEEK_STRIP_HEIGHT_PX = 72;
const HEADER_HEIGHT_PX = 125;
const CONDENSE_EARLY_PX = 96;
const WEEK_STRIP_ANIM_MS = 180;

export default function TimeBlockPage() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [monthBase, setMonthBase] = useState<Date>(startOfMonth(today));
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(today);

  useEffect(() => {
    const paramDate = searchParams.get("date");
    const paramYm = searchParams.get("ym");
    const paramW = searchParams.get("w");
    let parsedDate = today;
    if (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)) {
      const [y, m, d] = paramDate.split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(dt.getTime())) {
        parsedDate = dt;
      }
    }

    setSelectedDate(parsedDate);

    let parsedW = parsedDate;
    if (paramW && /^\d{4}-\d{2}-\d{2}$/.test(paramW)) {
      const [wy, wm, wd] = paramW.split("-");
      const dtw = new Date(Number(wy), Number(wm) - 1, Number(wd));
      if (!isNaN(dtw.getTime())) parsedW = dtw;
    }
    setWeekAnchorDate(parsedW);

    if (paramYm && /^\d{4}-\d{2}$/.test(paramYm)) {
      const [y, m] = paramYm.split("-");
      const dt = new Date(Number(y), Number(m) - 1, 1);
      if (!isNaN(dt.getTime())) {
        setMonthBase(dt);
      } else {
        setMonthBase(startOfMonth(parsedDate));
      }
    } else {
      setMonthBase(startOfMonth(parsedDate));
    }

    if (!paramDate || !paramYm) {
      const sp = new URLSearchParams(searchParams);
      if (!paramDate) {
        sp.set("date", `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}-${pad2(parsedDate.getDate())}`);
      }
      if (!paramYm) {
        sp.set("ym", `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}`);
      }
      setSearchParams(sp, { replace: true });
    }
  }, [searchParams, setSearchParams, today]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const monthSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    const monthEl = monthSectionRef.current;
    if (!monthEl) return;

    const rootEl = scrollRef.current;
    const isRootScrollable = (node: HTMLDivElement | null) => {
      if (!node) return false;
      return node.scrollHeight > node.clientHeight + 1;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        setIsCondensed(!entry.isIntersecting);
      },
      {
        root: isRootScrollable(rootEl) ? rootEl : null,
        threshold: 0,
        rootMargin: `-${HEADER_HEIGHT_PX + CONDENSE_EARLY_PX}px 0px 0px 0px`,
      }
    );

    io.observe(monthEl);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const current = searchParams.get("view");
    const nextView = isCondensed ? "week" : "month";
    if (current === nextView) return;

    const next = new URLSearchParams(searchParams);
    next.set("view", nextView);
    setSearchParams(next, { replace: true });
  }, [isCondensed, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isCondensed) return;
    const hasW = !!searchParams.get("w");
    if (hasW) return;

    const next = new URLSearchParams(searchParams);
    next.set("w", `${selectedDate.getFullYear()}-${pad2(selectedDate.getMonth() + 1)}-${pad2(selectedDate.getDate())}`);
    setSearchParams(next, { replace: true });
  }, [isCondensed, searchParams, selectedDate, setSearchParams]);

  const monthMatrix = useMemo(() => {
    const first = startOfMonth(monthBase);
    const last = new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 0);
    const gridStart = addDays(first, -getMondayIndex(first));
    const gridEnd = addDays(last, 6 - getMondayIndex(last));
    const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekCount = Math.ceil(totalDays / 7);

    const cells: DayCell[] = [];
    for (let i = 0; i < totalDays; i += 1) {
      const date = addDays(gridStart, i);
      cells.push({
        date,
        inMonth: date.getMonth() === monthBase.getMonth(),
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, selectedDate),
      });
    }

    const weeks: DayCell[][] = [];
    for (let w = 0; w < weekCount; w += 1) {
      weeks.push(cells.slice(w * 7, w * 7 + 7));
    }

    return weeks;
  }, [monthBase, selectedDate, today]);

  const selectedWeek = useMemo(() => {
    const start = startOfWeekMonday(weekAnchorDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return days.map((d) => ({
      date: d,
      inMonth: d.getMonth() === monthBase.getMonth(),
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
    }));
  }, [monthBase.getMonth(), weekAnchorDate, selectedDate, today]);

  const handlePickDate = (d: Date) => {
    const next = startOfDay(d);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("date", `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-${pad2(next.getDate())}`);
    nextParams.set("ym", `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`);
    nextParams.set("w", `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-${pad2(next.getDate())}`);
    setSearchParams(nextParams);
  };

  const hours = useMemo(() => Array.from({ length: 25 }, (_, i) => i + 5), []);

  return (
    <div className="h-full w-full bg-white">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto">
        <div ref={monthSectionRef} className="px-5 pt-3">
          <div className="grid grid-cols-7 text-center text-[16px] text-grey-light-active">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 pb-9">
            {monthMatrix.flat().map((cell) => {
              const day = cell.date.getDate();
              const selected = cell.isSelected;
              const muted = !cell.inMonth;
              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  onClick={() => handlePickDate(cell.date)}
                  className="flex items-center justify-center py-2"
                >
                  <div
                    className={`pt-px flex h-6 w-6 items-center text-center justify-center rounded-full text-[16px] font-medium ${
                      selected ? "bg-grey-dark text-white" : muted ? "text-grey-light-active" : "text-grey-dark"
                    }`}
                  >
                    {day}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="bg-white px-5"
          style={{
            position: "fixed",
            top: HEADER_HEIGHT_PX,
            left: 0,
            right: 0,
            height: WEEK_STRIP_HEIGHT_PX,
            zIndex: 20,
            opacity: isCondensed ? 1 : 0,
            transform: "translateY(0)",
            pointerEvents: isCondensed ? "auto" : "none",
            transition: `opacity ${WEEK_STRIP_ANIM_MS}ms ease`,
          }}
        >
          <div className="grid grid-cols-7 text-center pb-2 pt-1">
            {selectedWeek.map((cell, idx) => {
              const d = cell.date.getDate();
              const selected = cell.isSelected;
              return (
                <button
                  key={`${cell.date.toISOString()}-${idx}`}
                  type="button"
                  onClick={() => handlePickDate(cell.date)}
                  className="flex flex-col items-center justify-center py-2"
                >
                  <div className="text-[16px] text-grey-light-active">{DAY_LABELS[idx]}</div>
                  <div
                    className={`mt-1 pt-px flex h-6 w-6 items-center text-center justify-center rounded-full text-[16px] font-medium ${
                      selected ? "bg-grey-dark text-white" : "text-grey-dark"
                    }`}
                  >
                    {d}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ height: isCondensed ? WEEK_STRIP_HEIGHT_PX : 0 }} />

        <div className="px-5 pb-10">
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="relative flex min-h-16 items-center">
                <div className="shrink-0 text-[12px] text-grey-light-active">{toTimeLabel(h)}</div>
                <div className="ml-4.25 h-px flex-1 bg-grey-light" />
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
  );
}
