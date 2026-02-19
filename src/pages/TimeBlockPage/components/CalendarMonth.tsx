import React from "react";
import { useDroppable } from "@dnd-kit/core";

const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

type CalendarCell = {
  date: Date;
  inMonth: boolean;
  isSelected: boolean;
};

type CalendarMonthProps = {
  dayLabels: readonly string[];
  weeks: CalendarCell[][];
  onPickDate: (d: Date) => void;
  renderCellBottom?: (cell: CalendarCell) => React.ReactNode;
  dayLabelClassName?: string;
  containerClassName?: string;
  dayLabelRowClassName?: string;
  dayGridClassName?: string;
  cellButtonClassName?: string;
  dayCircleClassName?: string;
  showSelection?: boolean;
  onCellClick?: (cell: CalendarCell) => void;
  isCellDisabled?: (cell: CalendarCell) => boolean;
};

function DroppableMonthCell({
  cell,
  disabled,
  selected,
  muted,
  day,
  cellButtonClassName,
  dayCircleClassName,
  renderCellBottom,
  onPickDate,
  onCellClick,
}: {
  cell: CalendarCell;
  disabled: boolean;
  selected: boolean;
  muted: boolean;
  day: number;
  cellButtonClassName?: string;
  dayCircleClassName?: string;
  renderCellBottom?: (cell: CalendarCell) => React.ReactNode;
  showSelection?: boolean;
  onPickDate: (d: Date) => void;
  onCellClick?: (cell: CalendarCell) => void;
}) {
  const droppableId = `date:${toYmd(cell.date)}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      key={cell.date.toISOString()}
      ref={setNodeRef}
      className={isOver ? "ring-2 ring-grey-dark/30 rounded-md" : ""}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (onCellClick) {
            onCellClick(cell);
            return;
          }
          onPickDate(cell.date);
        }}
        className={`${cellButtonClassName ?? "flex items-center justify-center py-2"} ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div
            className={`pt-px flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-medium ${
              dayCircleClassName ??
              (selected
                ? "bg-grey-dark text-white"
                : muted
                ? "text-grey-light-active"
                : "text-grey-dark")
            }`}
          >
            {day}
          </div>
          {renderCellBottom ? <div className="mt-2.25">{renderCellBottom(cell)}</div> : null}
        </div>
      </button>
    </div>
  );
}

export default function CalendarMonth({
  dayLabels,
  weeks,
  onPickDate,
  renderCellBottom,
  dayLabelClassName,
  containerClassName,
  dayLabelRowClassName,
  dayGridClassName,
  cellButtonClassName,
  dayCircleClassName,
  showSelection,
  onCellClick,
  isCellDisabled,
}: CalendarMonthProps) {
  return (
    <div className={containerClassName ?? "pt-3 px-5"}>
      <div
        className={
          dayLabelRowClassName ??
          `grid grid-cols-7 text-center justify-items-center ${dayLabelClassName ?? "text-grey-light-active text-caption-12"}`
        }
      >
        {dayLabels.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className={dayGridClassName ?? "grid grid-cols-7 text-center justify-items-center gap-y-2 pb-9"}>
        {weeks.flat().map((cell) => {
          const disabled = isCellDisabled ? isCellDisabled(cell) : false;
          const selected = (showSelection ?? true) ? cell.isSelected : false;
          const muted = !cell.inMonth;
          const day = cell.date.getDate();

          return (
            <DroppableMonthCell
              key={cell.date.toISOString()}
              cell={cell}
              disabled={disabled}
              selected={selected}
              muted={muted}
              day={day}
              cellButtonClassName={cellButtonClassName}
              dayCircleClassName={dayCircleClassName}
              renderCellBottom={renderCellBottom}
              showSelection={showSelection}
              onPickDate={onPickDate}
              onCellClick={onCellClick}
            />
          );
        })} 
      </div>
    </div>
  );
}