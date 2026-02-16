import React from "react";

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
    <div className={containerClassName ?? "pt-3"}>
      <div
        className={
          dayLabelRowClassName ??
          `grid grid-cols-7 text-center ${dayLabelClassName ?? "text-grey-light-active text-caption-12"}`
        }
      >
        {dayLabels.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className={dayGridClassName ?? "grid grid-cols-7 gap-y-2 pb-9"}>
        {weeks.flat().map((cell) => {
          const disabled = isCellDisabled ? isCellDisabled(cell) : false;
          const selected = (showSelection ?? true) ? cell.isSelected : false;
          const muted = !cell.inMonth;
          const day = cell.date.getDate();

          return (
            <button
              key={cell.date.toISOString()}
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
          );
        })} 
      </div>
    </div>
  );
}