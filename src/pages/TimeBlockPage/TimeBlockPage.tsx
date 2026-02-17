import CalendarMonth from "@/pages/TimeBlockPage/components/CalendarMonth";
import CalendarWeekStrip from "@/pages/TimeBlockPage/components/CalendarWeekStrip";
import useCalendarModel from "@/hooks/TimeBlockPage/useCalendarModel";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { timeBlockDayApi } from "@/apis/TimeBlockPage/timeBlockDay";
import { todoStatusApi, type TodoStatusState } from "@/apis/TimeBlockPage/todoStatus";
import FlagSvg from "@/assets/flag.svg?react";
import type { ColorKey } from "@/constants/timeBlockCreateStore";
import { colorHexToKey } from "@/utils/ColorMapping";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

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

const colorVar = (key: ColorKey, tone: "nomal" | "light") =>
  `var(--color-folder-${key}-${tone})`;

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

type BlockDayItem = {
  blockId: number;
  todoId: number;
  startAt: string; // ISO string
  endAt: string; // ISO string
  todoName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  state: TodoStatusState;
  goalName?: string;
  color?: string;
};

type BlockItem = {
  b: BlockDayItem;
  task: { title: string };
  folder?: { title: string };
  colorKey: ColorKey;
  startMin: number;
  minutes: number;
  startAdj: number;
  endAdj: number;
};

type BlockLayout = {
  blockId: string;
  todoId: number;
  state: TodoStatusState;
  startAdj: number;
  endAdj: number;
  topPx: number;
  heightPx: number;
  lane: 0 | 1;
  cols: 1 | 2;
  task: BlockItem["task"];
  folder?: BlockItem["folder"];
  colorKey: ColorKey;
};

const computeLayoutsForDay = (args: {
  blocks: BlockDayItem[];
  selectedDateStr: string;
  START_MIN: number;
  PX_PER_MIN: number;
  parseHmToMinutes: (hm: string) => number | null;
  debug?: boolean;
}): BlockLayout[] => {
  const { blocks, START_MIN, PX_PER_MIN, parseHmToMinutes, debug } = args;

  const raw: BlockItem[] = (blocks ?? [])
    .map((b) => {
      const dStart = new Date(b.startAt);
      const dEnd = new Date(b.endAt);

      const hh = dStart.getHours();
      const mm = dStart.getMinutes();
      const startLabel = `${pad2(hh)}:${pad2(mm)}`;

      const startMin = parseHmToMinutes(startLabel);
      const minutesRaw = Math.round((dEnd.getTime() - dStart.getTime()) / 60000);
      const minutes = Number.isFinite(minutesRaw) && minutesRaw > 0 ? minutesRaw : 30;

      const colorKey = colorHexToKey(b.color);

      const task = { title: b.todoName };
      const folder = b.goalName ? { title: b.goalName } : undefined;

      const startAdj = startMin !== null && startMin < START_MIN ? startMin + 24 * 60 : startMin;
      const endAdj = startAdj !== null ? startAdj + minutes : null;

      return {
        b,
        task,
        folder,
        colorKey,
        startMin: startMin ?? 0,
        minutes,
        startAdj: startAdj ?? 0,
        endAdj: endAdj ?? 0,
      };
    })
    .filter((x) => Number.isFinite(x.startAdj) && Number.isFinite(x.endAdj)) as BlockItem[];

  raw.sort((a, b) => {
    if (a.startAdj !== b.startAdj) return a.startAdj - b.startAdj;
    return a.task.title.localeCompare(b.task.title, "ko");
  });

  if (debug) {
    const bad = (blocks ?? []).filter((b) => {
      const dStart = new Date(b.startAt);
      const startLabel = `${pad2(dStart.getHours())}:${pad2(dStart.getMinutes())}`;
      return parseHmToMinutes(startLabel) === null;
    });
    if (bad.length) console.warn("[TimeBlock] invalid startAt format", bad);
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
      blockId: String(it.b.blockId),
      todoId: it.b.todoId,
      state: it.b.state,
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

      const existing = layoutById.get(String(it.b.blockId));
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
        layoutById.set(String(it.b.blockId), l);
      }

      activeByLane[lane] = { id: String(it.b.blockId), endAdj: it.endAdj, lane };
    }
  }

  layouts.sort((a, b) => {
    if (a.startAdj !== b.startAdj) return a.startAdj - b.startAdj;
    return a.lane - b.lane;
  });

  return layouts;
};

const blockPositionStyle = (args: {
  topPx: number;
  heightPx: number;
  lane: 0 | 1;
  cols: 1 | 2;
  idx: number;
  backgroundColor: string;
}): CSSProperties => {
  const { topPx, heightPx, lane, cols, idx, backgroundColor } = args;

  return {
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
    backgroundColor,
  };
};

function TimeBlockItem(props: {
  layout: BlockLayout;
  idx: number;
  done: boolean;
  onToggle: () => void;
}) {
  const { layout, idx, done, onToggle } = props;
  const { blockId, topPx, heightPx, lane, cols, task, folder, colorKey } = layout;

  return (
    <button
      key={blockId}
      type="button"
      className={`absolute rounded-[5px] text-left box-border overflow-visible ${
        cols === 2 && lane === 1 ? "border border-white" : ""
      }`}
      style={blockPositionStyle({
        topPx,
        heightPx,
        lane,
        cols,
        idx,
        backgroundColor: colorVar(colorKey, "light"),
      })}
      onClick={onToggle}
    >
      <div className={`relative flex h-full w-full ${cols > 1 ? "px-3" : "px-4"}`}>
        <div className="flex h-full w-full min-w-0 items-center">
          <div className="flex w-full min-w-0 items-center gap-2">
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
                className={`flex-none truncate text-[12px] font-medium leading-normal text-grey-darker ${
                  done ? "line-through" : ""
                } ${cols > 1 ? "max-w-[70%]" : "max-w-[75%]"}`}
                title={task.title}
              >
                {task.title}
              </span>

              {folder ? (
                <span
                  className="flex min-w-0 flex-1 items-center"
                  style={{ color: colorVar(colorKey, "nomal") }}
                >
                  <span className="inline-flex shrink-0" aria-hidden>
                    <FlagSvg className="h-2 w-2" />
                  </span>
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

export default function TimeBlockPage() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [searchParams, setSearchParams] = useSearchParams();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const monthSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();

  const toggleTodoStatusMutation = useMutation({
    mutationFn: async (vars: { todoId: number; state: TodoStatusState }) => {
      return todoStatusApi.updateTodoStatus(vars.todoId, { state: vars.state });
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["timeblocks", "day", selectedDateStr] });
      return { vars };
    },
    onError: (_err, vars) => {
      setDoneIds((prev) => {
        const next = { ...prev };
        for (const l of layoutsForDay) {
          if (l.todoId === vars.todoId) {
            // revert to server state
            const serverDone = l.state === "complete";
            next[l.blockId] = serverDone;
          }
        }
        return next;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["timeblocks", "day", selectedDateStr] });
    },
  });

  const selectedDateStr = searchParams.get("date") ?? `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const ROW_HEIGHT_PX = 64;
  const START_HOUR = 5;
  const START_MIN = START_HOUR * 60;
  const PX_PER_MIN = ROW_HEIGHT_PX / 60;

  const { monthMatrix, selectedWeek, handlePickDate, hours } = useCalendarModel({
    today,
    searchParams,
    setSearchParams,
    isCondensed,
  });

  const { data: blocksForDay = [] } = useQuery({
    queryKey: ["timeblocks", "day", selectedDateStr],
    queryFn: () => timeBlockDayApi.getTimeBlocksByDay(selectedDateStr),
    staleTime: 30_000,
  });

  const layoutsForDay = useMemo(() => {
    return computeLayoutsForDay({
      blocks: blocksForDay,
      selectedDateStr,
      START_MIN,
      PX_PER_MIN,
      parseHmToMinutes,
      debug: import.meta.env.DEV,
    });
  }, [blocksForDay, selectedDateStr, START_MIN, PX_PER_MIN]);

  useEffect(() => {
    setDoneIds((prev) => {
      const next = { ...prev };
      for (const l of layoutsForDay) {
        if (next[l.blockId] === undefined) {
          next[l.blockId] = l.state === "complete";
        }
      }
      return next;
    });
  }, [layoutsForDay]);

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
              {(layoutsForDay ?? []).map((layout, idx) => (
                <TimeBlockItem
                  key={layout.blockId}
                  layout={layout}
                  idx={idx}
                  done={Boolean(doneIds[layout.blockId] ?? (layout.state === "complete"))}
                  onToggle={() => {
                    const currentDone = Boolean(doneIds[layout.blockId] ?? (layout.state === "complete"));
                    const nextState: TodoStatusState = currentDone ? "progress" : "complete";

                    // optimistic UI
                    setDoneIds((prev) => ({
                      ...prev,
                      [layout.blockId]: !currentDone,
                    }));

                    toggleTodoStatusMutation.mutate({ todoId: layout.todoId, state: nextState });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
