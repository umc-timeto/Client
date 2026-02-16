import CalendarMonth from "@/pages/TimeBlockPage/components/CalendarMonth";
import CalendarWeekStrip from "@/pages/TimeBlockPage/components/CalendarWeekStrip";
import useCalendarModel from "@/hooks/TimeBlockPage/useCalendarModel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  findFolderById,
  findGoalById,
  findTaskById,
  mockTimeBlocks,
} from "@/pages/TimeBlockPage/data/mockTimeBlockCreate";
import flagSvgRaw from "@/assets/flag.svg?raw";

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
const OVERLAP_PX = 24;


export default function TimeBlockPage() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [searchParams, setSearchParams] = useSearchParams();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const monthSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});

  const selectedDateStr = searchParams.get("date") ?? `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const ROW_HEIGHT_PX = 64;
  const START_HOUR = 5;
  const START_MIN = START_HOUR * 60;
  const PX_PER_MIN = ROW_HEIGHT_PX / 60;

  const parseHmToMinutes = (hm: string) => {
    const m = /^\d{1,2}:\d{2}$/.test(hm) ? hm : null;
    if (!m) return null;

    const [hhStr, mmStr] = m.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return hh * 60 + mm;
  };

  const colorVar = (key: string, tone: "nomal" | "light") =>
    `var(--color-folder-${key}-${tone})`;

  const flagSvg = useMemo(() => {
    return flagSvgRaw
      .replaceAll('stroke="#F6AE14"', 'stroke="currentColor"')
      .replaceAll('fill="#F6AE14"', 'fill="currentColor"')
      .replace(/width="[^"]*"/, 'width="8"')
      .replace(/height="[^"]*"/, 'height="8"');
  }, []);

  const { monthMatrix, selectedWeek, handlePickDate, hours } = useCalendarModel({
    today,
    searchParams,
    setSearchParams,
    isCondensed,
  });

  type BlockItem = {
    b: (typeof mockTimeBlocks)[number];
    task: NonNullable<ReturnType<typeof findTaskById>>;
    folder?: ReturnType<typeof findFolderById>;
    goal?: ReturnType<typeof findGoalById>;
    colorKey: string;
    startMin: number;
    minutes: number;
    startAdj: number;
    endAdj: number;
  };

  type BlockLayout = {
    blockId: string;
    startAdj: number;
    endAdj: number;
    topPx: number;
    heightPx: number;
    lane: 0 | 1;
    cols: 1 | 2;
    task: BlockItem["task"];
    folder?: BlockItem["folder"];
    colorKey: string;
  };

  const layoutsForDay = useMemo(() => {
    const raw: BlockItem[] = mockTimeBlocks
      .filter((b) => b.date === selectedDateStr)
      .map((b) => {
        const task = findTaskById(b.taskId);
        const folder = task ? findFolderById(task.folderId) : undefined;
        const goal = folder ? findGoalById(folder.goalId) : undefined;
        const colorKey = goal?.colorKey ?? task?.colorKey ?? "yellow";

        const startMin = parseHmToMinutes(b.start);
        const minutes = task?.minutes ?? 30;

        const startAdj = startMin !== null && startMin < START_MIN ? startMin + 24 * 60 : startMin;
        const endAdj = startAdj !== null ? startAdj + minutes : null;

        return { b, task, folder, goal, colorKey, startMin, minutes, startAdj, endAdj };
      })
      .filter((x) => Boolean(x.task) && x.startAdj !== null && x.endAdj !== null) as BlockItem[];

    raw.sort((a, b) => {
      if (a.startAdj !== b.startAdj) return a.startAdj - b.startAdj;
      return a.task.title.localeCompare(b.task.title, "ko");
    });

    if (import.meta.env.DEV) {
      const bad = mockTimeBlocks.filter(
        (b) => b.date === selectedDateStr && parseHmToMinutes(b.start) === null
      );
      if (bad.length) console.warn("[TimeBlock] invalid start format", bad);
    }


    type ActiveVisible = {
      id: string;
      endAdj: number;
      lane: 0 | 1;
    };

    const layouts: BlockLayout[] = [];
    const layoutById = new Map<string, BlockLayout>();

    const activeByLane: Partial<Record<0 | 1, ActiveVisible>> = {};
    const hiddenEnds: number[] = [];

    const purgeHidden = (nowStartAdj: number) => {
      for (let i = hiddenEnds.length - 1; i >= 0; i--) {
        if (hiddenEnds[i] <= nowStartAdj) hiddenEnds.splice(i, 1);
      }
    };

    const purgeVisible = (nowStartAdj: number) => {
      const lanes: (0 | 1)[] = [0, 1];
      for (const ln of lanes) {
        const v = activeByLane[ln];
        if (v && v.endAdj <= nowStartAdj) delete activeByLane[ln];
      }
    };

    const makeLayout = (it: BlockItem, lane: 0 | 1, cols: 1 | 2): BlockLayout => {
      const topPx = (it.startAdj - START_MIN) * PX_PER_MIN;
      const heightPx = Math.max(18, (it.endAdj - it.startAdj) * PX_PER_MIN);
      return {
        blockId: it.b.id,
        startAdj: it.startAdj,
        endAdj: it.endAdj,
        topPx,
        heightPx,
        lane,
        cols,
        task: it.task,
        folder: it.folder,
        colorKey: it.colorKey,
      };
    };

    const setCols2ForVisibleActives = () => {
      const lanes: (0 | 1)[] = [0, 1];
      for (const ln of lanes) {
        const v = activeByLane[ln];
        if (!v) continue;
        const l = layoutById.get(v.id);
        if (!l) continue;
        l.cols = 2;
        l.lane = ln;
      }
    };

    const visibleCount = () => (activeByLane[0] ? 1 : 0) + (activeByLane[1] ? 1 : 0);

    for (const it of raw) {
      purgeVisible(it.startAdj);
      purgeHidden(it.startAdj);

      const vis = visibleCount();
      const isOverlappingNow = vis + hiddenEnds.length > 0;

      let lane: 0 | 1 = 0;
      let willRender = true;

      if (!isOverlappingNow) {
        lane = 0;
      } else {
        const lane0Free = !activeByLane[0];
        const lane1Free = !activeByLane[1];

        if (lane0Free) lane = 0;
        else if (lane1Free) lane = 1;
        else {
          willRender = false;
          hiddenEnds.push(it.endAdj);
        }
      }

      if (isOverlappingNow) {
        setCols2ForVisibleActives();
      }

      if (willRender) {
        const cols: 1 | 2 = isOverlappingNow ? 2 : 1;
        const l = makeLayout(it, lane, cols);

        const existing = layoutById.get(it.b.id);
        if (existing) {
          existing.startAdj = l.startAdj;
          existing.endAdj = l.endAdj;
          existing.topPx = l.topPx;
          existing.heightPx = l.heightPx;
          existing.lane = l.lane;
          existing.cols = l.cols;
          existing.task = l.task;
          existing.folder = l.folder;
          existing.colorKey = l.colorKey;
        } else {
          layouts.push(l);
          layoutById.set(it.b.id, l);
        }

        activeByLane[lane] = { id: it.b.id, endAdj: it.endAdj, lane };
      }
    }

    layouts.sort((a, b) => {
      if (a.startAdj !== b.startAdj) return a.startAdj - b.startAdj;
      return a.lane - b.lane;
    });

    return layouts;
  }, [selectedDateStr, START_MIN, PX_PER_MIN]);

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
        <div ref={monthSectionRef} className="relative z-20">
          <CalendarMonth dayLabels={DAY_LABELS} weeks={monthMatrix} onPickDate={handlePickDate} />
        </div>

        <div className="relative z-30">
          <CalendarWeekStrip
            dayLabels={DAY_LABELS}
            cells={selectedWeek}
            visible={isCondensed}
            topPx={HEADER_HEIGHT_PX}
            heightPx={WEEK_STRIP_HEIGHT_PX}
            animMs={WEEK_STRIP_ANIM_MS}
            onPickDate={handlePickDate}
          />
        </div>

        <div className="px-5 pb-10">
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="relative flex" style={{ height: ROW_HEIGHT_PX }}>
                <div className="shrink-0 text-[12px] text-grey-light-active">{toTimeLabel(h)}</div>
                <div className="ml-4.25 h-px flex-1 bg-grey-light" />
              </div>
            ))}

            <div className="absolute left-0 right-0 top-0 z-0">
              {(layoutsForDay ?? []).map(
                (
                  { blockId, topPx, heightPx, lane, cols, task, folder, colorKey },
                  idx
                ) => {
                  const done = Boolean(doneIds[blockId]);

                  return (
                    <button
                      key={blockId}
                      type="button"
                      className={`absolute rounded-[5px] text-left box-border overflow-visible ${
                        cols === 2 && lane === 1 ? "border border-white" : ""
                      }`}
                      style={{
                        top: topPx,
                        height: heightPx,
                        left:
                          cols <= 1
                            ? "52px"
                            : `calc(52px + (((100% - 52px) + ${OVERLAP_PX}px) / 2 - ${OVERLAP_PX}px) * ${lane})`,
                        width:
                          cols <= 1
                            ? "calc(100% - 52px)"
                            : `calc(((100% - 52px) + ${OVERLAP_PX}px) / 2)`,
                        zIndex: Math.min(40, 10 + idx) + (lane === 1 ? 1 : 0),
                        backgroundColor: colorVar(colorKey, "light"),
                      }}
                      onClick={() =>
                        setDoneIds((prev) => ({
                          ...prev,
                          [blockId]: !prev[blockId],
                        }))
                      }
                    >
                      <div className={`relative flex h-full w-full ${cols > 1 ? "px-3" : "px-4"}`}>
                        <div className="flex h-full w-full min-w-0 items-center">
                          <div className="flex w-full min-w-0 items-center gap-2">
                            {/* checkbox */}
                            <span
                              className="shrink-0 h-3 w-3 rounded-[3px] border"
                              style={{
                                borderColor: colorVar(colorKey, "nomal"),
                                backgroundColor: done ? colorVar(colorKey, "nomal") : "transparent",
                              }}
                              aria-hidden
                            />

                            <div className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap">
                              <span
                                className={`flex-none truncate text-[12px] font-medium leading-normal text-grey-darker ${done ? "line-through" : ""} ${
                                  cols > 1 ? "max-w-[70%]" : "max-w-[75%]"
                                }`}
                                title={task.title}
                              >
                                {task.title}
                              </span>

                              {folder ? (
                                <span
                                  className="flex min-w-0 flex-1 items-center"
                                  style={{ color: colorVar(colorKey, "nomal") }}
                                >
                                  <span
                                    className="inline-flex shrink-0"
                                    aria-hidden
                                    dangerouslySetInnerHTML={{ __html: flagSvg }}
                                  />

                                  <span
                                    className="ml-[4.5px] min-w-0 flex-1 truncate text-[10px] font-medium leading-normal"
                                    title={folder.title}
                                  >
                                    {folder.title}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>

                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
