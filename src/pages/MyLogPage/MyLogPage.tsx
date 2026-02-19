import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import CalPrevSvg from "@/assets/cal_prev.svg?react";
import CalNextSvg from "@/assets/cal_next.svg?react";

import DefaultEmojiSvg from "@/assets/default_emoji.svg?react";
import GoodEmojiSvg from "@/assets/good_emoji.svg?react";
import SosoEmojiSvg from "@/assets/soso_emoji.svg?react";
import BadEmojiSvg from "@/assets/bad_emoji.svg?react";

import useCalendarModel from "@/hooks/TimeBlockPage/useCalendarModel";
import CalendarMonth from "@/pages/TimeBlockPage/components/CalendarMonth";

import { monthlyLogsApi } from "@/apis/MyLogPage/monthlyLogs";

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

  const [yearStr, monthStr] = ym.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const { monthMatrix } = useCalendarModel({
    today,
    searchParams,
    setSearchParams,
  });

  const { data: monthlyLogsResponse } = useQuery({
    queryKey: ["logs", "monthly", year, month],
    queryFn: () => monthlyLogsApi.getMonthlyLogs({ year, month }),
    enabled: Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12,
    staleTime: 30_000,
  });

  const monthlyLogs = useMemo(() => {
    if (!monthlyLogsResponse) return [];

    if (Array.isArray(monthlyLogsResponse)) {
      return monthlyLogsResponse;
    }

    if (
      typeof monthlyLogsResponse === "object" &&
      "data" in monthlyLogsResponse &&
      Array.isArray((monthlyLogsResponse as any).data)
    ) {
      return (monthlyLogsResponse as any).data;
    }

    return [];
  }, [monthlyLogsResponse]);

  const moodByDate = useMemo<Record<string, Mood>>(() => {
    const out: Record<string, Mood> = {};
    for (const item of monthlyLogs) {
      const key = String(item.date).trim();
      if (!key) continue;
      if (item.satisfaction === "GREAT") out[key] = "good";
      else if (item.satisfaction === "SOSO") out[key] = "soso";
      else if (item.satisfaction === "BAD") out[key] = "bad";
    }
    return out;
  }, [monthlyLogs]);

  const logIdByDate = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const item of monthlyLogs) {
      const key = String(item.date).trim();
      if (!key) continue;
      if (typeof item.logId === "number") out[key] = item.logId;
    }
    return out;
  }, [monthlyLogs]);

  const goMonth = (delta: number) => {
    const nextYm = shiftYm(ym, delta);
    const next = new URLSearchParams(searchParams);
    next.set("ym", nextYm);
    setSearchParams(next);
  };

  const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const handleCellClick = (cell: { date: Date; inMonth: boolean }) => {
    if (!cell.inMonth) return;

    const ymd = toYmd(cell.date);
    const logId = logIdByDate[ymd];

    const qs = new URLSearchParams();
    qs.set("date", ymd);
    if (typeof logId === "number") qs.set("logId", String(logId));

    navigate(`/survey?${qs.toString()}`);
  };

  const renderEmoji = (cell: { date: Date; inMonth: boolean }) => {
    const key = `${cell.date.getFullYear()}-${pad2(cell.date.getMonth() + 1)}-${pad2(cell.date.getDate())}`;
    const mood = moodByDate[key];

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
          isCellDisabled={(cell) => {
            return !cell.inMonth;
          }}
        />
      </div>
    </div>
  );
}