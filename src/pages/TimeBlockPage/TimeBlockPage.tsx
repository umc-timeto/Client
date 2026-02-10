import CalendarMonth from "@/pages/TimeBlockPage/components/CalendarMonth";
import CalendarWeekStrip from "@/pages/TimeBlockPage/components/CalendarWeekStrip";
import useCalendarModel from "@/hooks/TimeBlockPage/useCalendarModel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const monthSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  const { monthMatrix, selectedWeek, handlePickDate, hours } = useCalendarModel({
    today,
    searchParams,
    setSearchParams,
    isCondensed,
  });

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

  return (
    <div className="h-full w-full bg-white">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto">
        <div ref={monthSectionRef}>
          <CalendarMonth dayLabels={DAY_LABELS} weeks={monthMatrix} onPickDate={handlePickDate} />
        </div>

        <CalendarWeekStrip
          dayLabels={DAY_LABELS}
          cells={selectedWeek}
          visible={isCondensed}
          topPx={HEADER_HEIGHT_PX}
          heightPx={WEEK_STRIP_HEIGHT_PX}
          animMs={WEEK_STRIP_ANIM_MS}
          onPickDate={handlePickDate}
        />

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
