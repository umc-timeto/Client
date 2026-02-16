
type CalendarCell = {
  date: Date;
  inMonth: boolean;
  isSelected: boolean;
};

type CalendarMonthProps = {
  dayLabels: readonly string[];
  weeks: CalendarCell[][];
  onPickDate: (d: Date) => void;
};

export default function CalendarMonth({ dayLabels, weeks, onPickDate }: CalendarMonthProps) {
  return (
    <div className="px-5 pt-3">
      <div className="grid grid-cols-7 text-center text-[16px] text-grey-light-active">
        {dayLabels.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 pb-9">
        {weeks.flat().map((cell) => {
          const day = cell.date.getDate();
          const selected = cell.isSelected;
          const muted = !cell.inMonth;

          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              onClick={() => onPickDate(cell.date)}
              className="flex items-center justify-center py-2"
            >
              <div
                className={`pt-px flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-medium ${
                  selected ? "bg-grey-dark text-white" : muted ? "text-grey-light-active" : "text-grey-dark"
                }`}
              >
                {day}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}