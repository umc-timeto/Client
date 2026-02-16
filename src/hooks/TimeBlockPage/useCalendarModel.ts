import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

type DayCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

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

type UseCalendarModelArgs = {
  today: Date;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
  isCondensed?: boolean;
};

type UseCalendarModelResult = {
  selectedDate: Date;
  monthBase: Date;
  weekAnchorDate: Date;
  monthMatrix: DayCell[][];
  selectedWeek: DayCell[];
  handlePickDate: (d: Date) => void;
  hours: number[];
};

export default function useCalendarModel({
  today,
  searchParams,
  setSearchParams,
  isCondensed,
}: UseCalendarModelArgs): UseCalendarModelResult {
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [monthBase, setMonthBase] = useState<Date>(startOfMonth(today));
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(today);

  // 1) query(date/ym/w) -> state 동기화 + 누락된 query 보정
  useEffect(() => {
    const paramDate = searchParams.get("date");
    const paramYm = searchParams.get("ym");
    const paramW = searchParams.get("w");

    let parsedDate = today;

    if (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)) {
      const [y, m, d] = paramDate.split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(dt.getTime())) parsedDate = dt;
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
      if (!isNaN(dt.getTime())) setMonthBase(dt);
      else setMonthBase(startOfMonth(parsedDate));
    } else {
      setMonthBase(startOfMonth(parsedDate));
    }

    if (!paramDate || !paramYm) {
      const sp = new URLSearchParams(searchParams);
      if (!paramDate) sp.set("date", `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}-${pad2(parsedDate.getDate())}`);
      if (!paramYm) sp.set("ym", `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}`);
      setSearchParams(sp, { replace: true });
    }
  }, [searchParams, setSearchParams, today]);

  useEffect(() => {
    if (typeof isCondensed !== "boolean") return;

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

  return {
    selectedDate,
    monthBase,
    weekAnchorDate,
    monthMatrix,
    selectedWeek,
    handlePickDate,
    hours,
  };
}