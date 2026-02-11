type GoalColorPickerProps = {
  value: string | null;
  onChange: (v: string) => void;
};

const COLORS = [
  "#28AEA6",
  "#FC9C32",
  "#141414",
  "#A5A5A5",
  "#ED0505",
];

export default function GoalColorPicker({ value, onChange }: GoalColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {/*라벨 영역*/}
      <div className="title-14-semibold text-gray-700">목표 색상</div>

      {/*색상 선택 영역*/}
      <div className="flex gap-3">
        {COLORS.map((c) => {
          const selected = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`h-9 w-9 rounded-full border ${
                selected ? "border-gray-700" : "border-gray-200"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`color-${c}`}
            />
          );
        })}
      </div>
    </div>
  );
}
