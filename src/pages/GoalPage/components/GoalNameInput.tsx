type GoalNameInputProps = {
  value: string;
  onChange: (v: string) => void;
};

export default function GoalNameInput({ value, onChange }: GoalNameInputProps) {
  const max = 20;

  return (
    <div className="flex flex-col gap-2">
      {/*라벨 영역*/}
      <div className="title-14-semibold text-gray-700">목표 이름</div>

      {/*입력 영역*/}
      <div className="rounded-xl border border-gray-200 px-4 py-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, max))}
          placeholder="목표 이름을 입력하세요"
          className="w-full bg-transparent outline-none body-16-medium text-gray-700 placeholder:text-gray-300"
        />
      </div>

      {/*글자수 안내 영역*/}
      <div className="body-13-medium text-gray-300">
        {value.length}/{max}
      </div>
    </div>
  );
}
