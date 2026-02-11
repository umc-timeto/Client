import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CalPrevSvg from "@/assets/cal_prev.svg?react";
import CalNextSvg from "@/assets/cal_next.svg?react";

import DefaultEmojiSvg from "@/assets/default_emoji.svg?react";
import GoodEmojiSvg from "@/assets/good_emoji.svg?react";
import SosoEmojiSvg from "@/assets/soso_emoji.svg?react";
import BadEmojiSvg from "@/assets/bad_emoji.svg?react";

import useCalendarModel from "@/hooks/TimeBlockPage/useCalendarModel";
import CalendarMonth from "@/pages/TimeBlockPage/components/CalendarMonth";

type Mood = "good" | "soso" | "bad";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatYearMonthFromYm = (v: string) => {
  const [y, m] = v.split("-");
  return `${y}년 ${Number(m)}월`;
};

const shiftYm = (v: string, delta: number) => {
  const [y, m] = v.split("-");
  const base = new Date(Number(y), Number(m) - 1 + delta, 1);
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}`;
};

export default function MyLogPage() {
  const today = useMemo(() => new Date(), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawYm = searchParams.get("ym");
  const fallbackYm = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}`;
  const ym = rawYm && /^\d{4}-\d{2}$/.test(rawYm) ? rawYm : fallbackYm;

  const { monthMatrix } = useCalendarModel({
    today,
    searchParams,
    setSearchParams,
  });

  const mockMoodByDate = useMemo<Record<string, Mood>>(
    () => ({
      "2026-01-01": "good",
      "2026-01-04": "soso",
      "2026-01-08": "bad",
      "2026-01-15": "good",
      "2026-01-22": "soso",
      "2026-01-26": "bad",
    }),
    []
  );

  const goMonth = (delta: number) => {
    const nextYm = shiftYm(ym, delta);
    const next = new URLSearchParams(searchParams);
    next.set("ym", nextYm);
    setSearchParams(next);
  };

  const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const isFuture = (d: Date) => {
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return a > b;
  };

  const handleCellClick = (cell: { date: Date; inMonth: boolean }) => {
    if (!cell.inMonth) return;
    if (isFuture(cell.date)) return;
    const ymd = toYmd(cell.date);
    navigate(`/survey?date=${ymd}`);
  };

  const renderEmoji = (cell: { date: Date; inMonth: boolean }) => {
    const key = `${cell.date.getFullYear()}-${pad2(cell.date.getMonth() + 1)}-${pad2(cell.date.getDate())}`;
    const mood = mockMoodByDate[key];

    if (!cell.inMonth) {
      return <DefaultEmojiSvg className="h-8 w-8" />;
    }

    if (mood === "good") return <GoodEmojiSvg className="h-8 w-8" />;
    if (mood === "soso") return <SosoEmojiSvg className="h-8 w-8" />;
    if (mood === "bad") return <BadEmojiSvg className="h-8 w-8" />;

    return <DefaultEmojiSvg className="h-8 w-8" />;
  };

  return (
    <div className="px-5">
      <div className="mt-4.75 flex items-center justify-between gap-6">
        <button type="button" aria-label="previous month" onClick={() => goMonth(-1)}>
          <CalPrevSvg className="h-7 w-7" />
        </button>

        <div className="text-title-20 font-semibold text-grey-dark">{formatYearMonthFromYm(ym)}</div>

        <button type="button" aria-label="next month" onClick={() => goMonth(1)}>
          <CalNextSvg className="h-7 w-7" />
        </button>
      </div>

      <div className="mt-5">
        <CalendarMonth
          dayLabels={DAY_LABELS}
          weeks={monthMatrix}
          onPickDate={() => {}}
          renderCellBottom={(cell) => renderEmoji(cell)}
          dayLabelClassName="text-grey-dark text-[12px]"
          showSelection={false}
          onCellClick={handleCellClick}
          isCellDisabled={(cell) => !cell.inMonth || isFuture(cell.date)}
        />
      </div>
    </div>
  );
}