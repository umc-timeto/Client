
type CalendarCell = {
  date: Date;
  isSelected: boolean;
};

type CalendarWeekStripProps = {
  dayLabels: readonly string[];
  cells: CalendarCell[];
  visible: boolean;
  topPx: number;
  heightPx: number;
  animMs: number;
  onPickDate: (d: Date) => void;
};

export default function CalendarWeekStrip({
  dayLabels,
  cells,
  visible,
  topPx,
  heightPx,
  animMs,
  onPickDate,
}: CalendarWeekStripProps) {
  return (
    <>
      <div
        className="bg-white px-5"
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
        <div className="grid grid-cols-7 pb-2 pt-1 text-center">
          {cells.map((cell, idx) => {
            const d = cell.date.getDate();
            const selected = cell.isSelected;

            return (
              <button
                key={`${cell.date.toISOString()}-${idx}`}
                type="button"
                onClick={() => onPickDate(cell.date)}
                className="flex flex-col items-center justify-center py-2"
              >
                <div className="text-[16px] text-grey-light-active">{dayLabels[idx]}</div>
                <div
                  className={`mt-1 pt-px flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-medium ${
                    selected ? "bg-grey-dark text-white" : "text-grey-dark"
                  }`}
                >
                  {d}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: visible ? heightPx : 0 }} />
    </>
  );
}