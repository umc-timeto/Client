import CalendarMonth from "@/pages/TimeBlockPage/components/CalendarMonth";
import ConfirmModal from "@/components/ConfirmModal";
import TaskInfoModalContainer from "@/components/TaskInfoModalContainer";
import CalendarWeekStrip from "@/pages/TimeBlockPage/components/CalendarWeekStrip";
import useCalendarModel from "@/hooks/TimeBlockPage/useCalendarModel";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";

import { timeBlockDayApi } from "@/apis/TimeBlockPage/timeBlockDay";
import { todoStatusApi, type TodoStatusState } from "@/apis/TimeBlockPage/todoStatus";
import { timeBlockMoveApi } from "@/apis/TimeBlockPage/timeBlockMove";
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

const parseYmd = (ymd: string) => {
  const m = /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
  if (!m) return null;
  const [y, mo, d] = m.split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return { y, mo, d };
};

const formatLocalStartAt = (d: Date) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

const minutesToLocalDate = (selectedDateStr: string, startAdjMinutes: number) => {
  const p = parseYmd(selectedDateStr);
  if (!p) return null;

  const base = new Date(p.y, p.mo - 1, p.d, 0, 0, 0, 0);
  const dayOffset = Math.floor(startAdjMinutes / (24 * 60));
  const minsInDay = ((startAdjMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hh = Math.floor(minsInDay / 60);
  const mm = minsInDay % 60;

  const dt = new Date(base);
  dt.setDate(dt.getDate() + dayOffset);
  dt.setHours(hh, mm, 0, 0);
  return dt;
};

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
  startAt: string;
  endAt: string;
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
    const heightPx = Math.max(28, (it.endAdj - it.startAdj) * PX_PER_MIN);
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
  onOpenDetail: () => void;
  draggable: {
    listeners?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    setNodeRef: (node: HTMLElement | null) => void;
    transformY: number;
    isDragging: boolean;
  };
}) {
  const { layout, idx, done, onToggle, onOpenDetail, draggable } = props;
  const { blockId, topPx, heightPx, lane, cols, task, folder, colorKey } = layout;

  const baseStyle = blockPositionStyle({
    topPx,
    heightPx,
    lane,
    cols,
    idx,
    backgroundColor: colorVar(colorKey, "light"),
  });

  const style: CSSProperties = {
    ...baseStyle,
    transform: `translate3d(0, ${draggable.transformY}px, 0)`,
    cursor: "grab",
    touchAction: "none",
    opacity: draggable.isDragging ? 0.9 : 1,
  };

  return (
    <button
      ref={draggable.setNodeRef as any}
      key={blockId}
      type="button"
      className={`absolute rounded-[5px] text-left box-border overflow-visible ${
        cols === 2 && lane === 1 ? "border border-white" : ""
      }`}
      style={style}
      onClick={() => {
  onOpenDetail();
}}
      {...(draggable.attributes as any)}
      {...(draggable.listeners as any)}
    >
      <div className={`relative flex h-full w-full ${cols > 1 ? "px-3" : "px-4"}`}>
        <div className="flex h-full w-full min-w-0 items-center">
          <div className="flex w-full min-w-0 items-center gap-2">
            <button
              type="button"
              className="shrink-0 h-3 w-3 rounded-[3px] border flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              style={{
                borderColor: colorVar(colorKey, "nomal"),
                backgroundColor: done ? colorVar(colorKey, "nomal") : "transparent",
              }}
              aria-label="toggle complete"
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

function DraggableTimeBlockItem(props: {
  layout: BlockLayout;
  idx: number;
  done: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
}) {
  const { layout, idx, done, onToggle, onOpenDetail } = props;
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: layout.blockId,
  });

  return (
    <TimeBlockItem
      layout={layout}
      idx={idx}
      done={done}
      onToggle={onToggle}
      onOpenDetail={onOpenDetail}
      draggable={{
        setNodeRef,
        listeners,
        attributes: attributes as unknown as Record<string, unknown>,
        transformY: transform?.y ?? 0,
        isDragging: Boolean(isDragging),
      }}
    />
  );
}

export default function TimeBlockPage() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();

  
const defaultTodayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

const selectedDateStr = useMemo(
  () => searchParams.get("date") ?? defaultTodayStr,
  [searchParams, defaultTodayStr]
);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const monthSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAutoAppend, setPendingAutoAppend] = useState<{
    blockId: number | string;
    dateStr: string;
    requestedStartAt: string;
    durationMin: number;
    autoStartAt: string;
  } | null>(null);
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  
  useEffect(() => {
    const invalidateAll = () => {
      queryClient.invalidateQueries({
        queryKey: ["timeblocks"],
        exact: false,
      });
    };

    
    invalidateAll();

    
    const onFocus = () => invalidateAll();

    
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        invalidateAll();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [queryClient, location.key]);

  const pendingStatusBlockIdsRef = useRef<Set<string>>(new Set());

  const toggleTodoStatusMutation = useMutation({
    mutationFn: async (vars: { blockId: string; todoId: number; state: TodoStatusState }) => {
      return todoStatusApi.updateTodoStatus(vars.todoId, { state: vars.state });
    },
    onMutate: async (vars) => {
      
      pendingStatusBlockIdsRef.current.add(String(vars.blockId));

      await queryClient.cancelQueries({ queryKey: ["timeblocks", selectedDateStr] });
      return { vars };
    },
    onError: (_err, vars) => {
      
      setDoneIds((prev) => {
        const next = { ...prev };
        const l = layoutsForDay.find((x) => x.todoId === vars.todoId);
        if (l) {
          next[String(l.blockId)] = l.state === "complete";
        }
        return next;
      });
    },
    onSettled: (_data, _err, vars) => {
      pendingStatusBlockIdsRef.current.delete(String(vars.blockId));

      
      queryClient.invalidateQueries({ queryKey: ["timeblocks"], exact: false });
    },
  });

  

  useEffect(() => {
    sessionStorage.setItem("timetto_timeblock_date", selectedDateStr);
  }, [selectedDateStr]);

  const ROW_HEIGHT_PX = 64;
  const START_HOUR = 5;
  const START_MIN = START_HOUR * 60;
  const PX_PER_MIN = ROW_HEIGHT_PX / 60;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const moveBlockMutation = useMutation({
    mutationFn: async (vars: { blockId: number | string; startAt: string; dateStr: string; durationMin: number }) => {
      return timeBlockMoveApi.moveBlock(vars.blockId, vars.startAt);
    },
    onError: (err: any, vars) => {
      if (err?.response?.status !== 400) return;

      const cached = queryClient.getQueryData<BlockDayItem[]>(["timeblocks", vars.dateStr]);
      const arr = Array.isArray(cached) ? cached : [];

      const reqStart = new Date(vars.startAt);
      const reqEnd = new Date(reqStart.getTime() + vars.durationMin * 60_000);

      const conflicts = arr
        .filter((b) => String(b.blockId) !== String(vars.blockId))
        .map((b) => ({ b, s: new Date(b.startAt), e: new Date(b.endAt) }))
        .filter(({ s, e }) => reqStart < e && reqEnd > s);

      const autoStartDt =
        conflicts.length > 0
          ? conflicts.reduce((acc, cur) => (cur.e > acc ? cur.e : acc), conflicts[0].e)
          : reqStart;

      const autoStartAt = formatLocalStartAt(autoStartDt);

      setPendingAutoAppend({
        blockId: vars.blockId,
        dateStr: vars.dateStr,
        requestedStartAt: vars.startAt,
        durationMin: vars.durationMin,
        autoStartAt,
      });
      setConfirmOpen(true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeblocks"],
        exact: false,
      });
    },
  });

const { monthMatrix, selectedWeek, hours } = useCalendarModel({
  today,
  searchParams,
  setSearchParams,
  isCondensed,
});

const pickDate = useCallback(
  (dateStr: string) => {
    const v = String(dateStr ?? "").trim();
    if (!v) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("date", v);
        next.set("ym", v.slice(0, 7));
        next.set("w", v);
        return next;
      },
      { replace: true }
    );
  },
  [setSearchParams]
);

const {
  data: blocksForDay = [],
} = useQuery({
  queryKey: ["timeblocks", selectedDateStr],
  queryFn: () => timeBlockDayApi.getTimeBlocksByDay(selectedDateStr),
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: "always",
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
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

  
  const addDaysToYmd = (ymd: string, offset: number) => {
    const p = parseYmd(ymd);
    if (!p) return ymd;
    const base = new Date(p.y, p.mo - 1, p.d);
    base.setDate(base.getDate() + offset);
    return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
  };

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const activeId = String(e.active?.id ?? "");
      if (!activeId) return;

      const layout = layoutsForDay.find((l) => l.blockId === activeId);
      if (!layout) return;

      const deltaMinRaw = e.delta?.y ? e.delta.y / PX_PER_MIN : 0;
      if (!Number.isFinite(deltaMinRaw) || Math.abs(deltaMinRaw) < 0.5) return;

      const snap = 5;
      const deltaMin = Math.round(deltaMinRaw / snap) * snap;

      const durationMin = Math.max(1, layout.endAdj - layout.startAdj);
      const minStart = START_MIN;
      const maxStart = START_MIN + 24 * 60 - durationMin;

      const nextStartAdj = Math.min(maxStart, Math.max(minStart, layout.startAdj + deltaMin));

      const deltaX = e.delta?.x ?? 0;

      const dayOffset = Math.round(deltaX / 200);

      const targetDateStr =
        dayOffset !== 0 ? addDaysToYmd(selectedDateStr, dayOffset) : selectedDateStr;

      const nextStartDt = minutesToLocalDate(targetDateStr, nextStartAdj);
      if (!nextStartDt) return;

      const nextEndDt = new Date(nextStartDt.getTime() + durationMin * 60000);

      const sourceDateStr = selectedDateStr;
      const movedAcrossDay = dayOffset !== 0;

      const nextStartAtStr = formatLocalStartAt(nextStartDt) + ":00";
      const nextEndAtStr = formatLocalStartAt(nextEndDt) + ":00";

      if (!movedAcrossDay) {
        queryClient.setQueryData<BlockDayItem[]>(["timeblocks", sourceDateStr], (prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map((b) => {
            if (String(b.blockId) !== activeId) return b;
            return {
              ...b,
              startAt: nextStartAtStr,
              endAt: nextEndAtStr,
            };
          });
        });
      } else {
        queryClient.setQueryData<BlockDayItem[]>(["timeblocks", sourceDateStr], (prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.filter((b) => String(b.blockId) !== activeId);
        });

        queryClient.setQueryData<BlockDayItem[]>(["timeblocks", targetDateStr], (prev) => {
          const arr = Array.isArray(prev) ? prev : [];

          const fromSource = blocksForDay.find((b) => String(b.blockId) === activeId);

          const base: BlockDayItem = fromSource
            ? {
                ...fromSource,
                startAt: nextStartAtStr,
                endAt: nextEndAtStr,
              }
            : {
                blockId: Number(activeId),
                todoId: layout.todoId,
                startAt: nextStartAtStr,
                endAt: nextEndAtStr,
                todoName: layout.task.title,
                priority: "MEDIUM",
                state: layout.state,
                goalName: layout.folder?.title,
              };

          const exists = arr.some((b) => String(b.blockId) === activeId);
          const nextArr = exists
            ? arr.map((b) => (String(b.blockId) === activeId ? base : b))
            : [...arr, base];

          nextArr.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          return nextArr;
        });

        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("date", targetDateStr);
            next.set("ym", targetDateStr.slice(0, 7));
            next.set("w", targetDateStr);
            return next;
          },
          { replace: true }
        );

        queryClient.invalidateQueries({ queryKey: ["timeblocks", targetDateStr] });
        queryClient.invalidateQueries({ queryKey: ["timeblocks", sourceDateStr] });
      }

      moveBlockMutation.mutate({
        blockId: layout.blockId,
        startAt: formatLocalStartAt(nextStartDt),
        dateStr: targetDateStr,
        durationMin,
      });
    },
    [
      PX_PER_MIN,
      START_MIN,
      layoutsForDay,
      queryClient,
      selectedDateStr,
      moveBlockMutation,
      setSearchParams,
      blocksForDay,
    ]
  );

  useEffect(() => {
    setDoneIds((prev) => {
      const next: Record<string, boolean> = { ...prev };

      for (const l of layoutsForDay) {
        const key = String(l.blockId);

        
        if (pendingStatusBlockIdsRef.current.has(key)) continue;

        
        next[key] = l.state === "complete";
      }

      
      const existing = new Set(layoutsForDay.map((l) => String(l.blockId)));
      for (const k of Object.keys(next)) {
        if (!existing.has(k)) delete next[k];
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

  // Memoized callback for calendar date picking
  const onPickDateFromCalendar = useCallback(
    (d: Date) => {
      const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      pickDate(dateStr);
    },
    [pickDate]
  );

  return (
    <div className="h-full w-full bg-white">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto">
        <div ref={monthSectionRef} className="relative z-20">
          <CalendarMonth dayLabels={DAY_LABELS} weeks={monthMatrix} onPickDate={onPickDateFromCalendar} />
        </div>

        <div className="relative z-30">
          <CalendarWeekStrip
            dayLabels={DAY_LABELS}
            cells={selectedWeek}
            visible={isCondensed}
            topPx={HEADER_HEIGHT_PX}
            heightPx={WEEK_STRIP_HEIGHT_PX}
            animMs={WEEK_STRIP_ANIM_MS}
            onPickDate={onPickDateFromCalendar}
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

            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <div className="absolute left-0 right-0 top-0 z-0">
                {(layoutsForDay ?? []).map((layout, idx) => (
                  <DraggableTimeBlockItem
  key={layout.blockId}
  layout={layout}
  idx={idx}
  done={Boolean(doneIds[layout.blockId] ?? (layout.state === "complete"))}
  onToggle={() => {
    const currentDone = Boolean(doneIds[layout.blockId] ?? (layout.state === "complete"));
    const nextState: TodoStatusState = currentDone ? "progress" : "complete";

    setDoneIds((prev) => ({
      ...prev,
      [layout.blockId]: !currentDone,
    }));

    toggleTodoStatusMutation.mutate({ blockId: String(layout.blockId), todoId: layout.todoId, state: nextState });
  }}
  onOpenDetail={() => {
    setOpenTaskId(layout.todoId);
  }}
/>
                ))}
              </div>
            </DndContext>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="선택한 시간에 다른 할 일이 있어요"
        cancelText="취소"
        confirmText="확인"
        variant="timeblockConflict"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAutoAppend(null);
        }}
        onConfirm={() => {
          if (pendingAutoAppend) {
            const { blockId, dateStr, autoStartAt, durationMin } = pendingAutoAppend;

            const startDt = new Date(autoStartAt);
            const endDt = new Date(startDt.getTime() + durationMin * 60_000);
            const nextStartAtStr = formatLocalStartAt(startDt) + ":00";
            const nextEndAtStr = formatLocalStartAt(endDt) + ":00";

            queryClient.setQueryData<BlockDayItem[]>(["timeblocks", dateStr], (prev) => {
              const arr = Array.isArray(prev) ? prev : [];
              return arr.map((b) => {
                if (String(b.blockId) !== String(blockId)) return b;
                return {
                  ...b,
                  startAt: nextStartAtStr,
                  endAt: nextEndAtStr,
                };
              });
            });

            moveBlockMutation.mutate({
              blockId,
              startAt: formatLocalStartAt(startDt),
              dateStr,
              durationMin,
            });
          }

          setConfirmOpen(false);
          setPendingAutoAppend(null);
        }}
      />
      <TaskInfoModalContainer
        open={openTaskId !== null}
        todoId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onEditStep1={() => {}}
        onEditStep2={() => {}}
        onChanged={() => {
          
          queryClient.invalidateQueries({
            queryKey: ["timeblocks"],
            exact: false,
          });

          
          setDoneIds({});
        }}
      />
    </div>
  );
}
