import { useDroppable } from "@dnd-kit/core";

const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

type CalendarCell = {
  date: Date;
  isSelected: boolean;
};

type CalendarWeekStripProps = {
  dayLabels: readonly string[];
  cells: CalendarCell[];
  visible?: boolean;
  topPx?: number;
  heightPx?: number;
  animMs?: number;
  onPickDate: (d: Date) => void;
};

function DroppableDateCell(props: {
  cell: CalendarCell;
  label: string;
  onPickDate: (d: Date) => void;
}) {
  const { cell, label, onPickDate } = props;

  const droppableId = `date:${toYmd(cell.date)}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const d = cell.date.getDate();
  const selected = cell.isSelected;

  return (
    <div
      ref={setNodeRef}
      className={isOver ? "ring-2 ring-grey-dark/30 rounded-md" : ""}
    >
      <button
        type="button"
        onClick={() => onPickDate(cell.date)}
        className="flex flex-col items-center justify-center py-2"
      >
        <div className="text-[16px] text-grey-light-active">{label}</div>
        <div
          className={`mt-1 pt-px flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-medium ${
            selected ? "bg-grey-dark text-white" : "text-grey-dark"
          }`}
        >
          {d}
        </div>
      </button>
    </div>
  );
}

export default function CalendarWeekStrip({
  dayLabels,
  cells,
  visible = true,
  topPx = 0,
  heightPx = 88,
  animMs = 200,
  onPickDate,
}: CalendarWeekStripProps) {
  return (
    <>
      <div
        className="bg-white"
        style={{
          position: "fixed",
          top: topPx,
          left: 0,
          right: 0,
          height: heightPx,
          zIndex: 20,
          opacity: visible ? 1 : 0,
          transform: "translateY(0)",
          pointerEvents: visible ? "auto" : "none",
          transition: `opacity ${animMs}ms ease`,
        }}
      >
        <div className="grid grid-cols-7 pb-2 pt-1 px-4 text-center justify-items-center">
          {cells.map((cell, idx) => (
            <DroppableDateCell
              key={`${cell.date.toISOString()}-${idx}`}
              cell={cell}
              label={dayLabels[idx]}
              onPickDate={onPickDate}
            />
          ))}
        </div>
      </div>

      <div style={{ height: visible ? heightPx : 0 }} />
    </>
  );
}