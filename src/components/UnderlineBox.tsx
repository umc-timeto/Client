import type { ReactNode } from "react";

type Props = {
  label: string;
  active: boolean; //값이 있거나 선택된 상태면 true
  valueText?: string; //button 모드에서 보여줄 텍스트
  placeholder?: string; //값 없을 때 보여줄 공백/placeholder
  mode: "input" | "button";

  //input용
  inputValue?: string;
  onInputChange?: (v: string) => void;

  //button용
  onClick?: () => void;

  //확장 슬롯(필요하면 오른쪽 아이콘 같은 거)
  rightSlot?: ReactNode;
};

//피그마값(입력/선택 텍스트): #0F0F0F / 22px / 600 / H=25
const VALUE_TEXT_CLS =
  "font-pretendard text-[22px] font-semibold leading-[25px] text-[#0F0F0F]";

export default function FormFieldUnderline({
  label,
  active,
  valueText,
  placeholder = " ",
  mode,
  inputValue,
  onInputChange,
  onClick,
  rightSlot,
}: Props) {
  return (
    <div>
      {/*라벨*/}
      <div
        className={[
          "font-pretendard text-[13px] font-medium leading-normal",
          active ? "text-gray-700" : "text-gray-300",
        ].join(" ")}
      >
        {label}
      </div>

      {/*밑줄 영역*/}
      <div
        className={[
          "mt-3 w-full border-b pb-2 flex items-center gap-2",
          active ? "border-gray-700" : "border-gray-200",
        ].join(" ")}
      >
        {mode === "input" ? (
          <input
            value={inputValue ?? ""}
            onChange={(e) => onInputChange?.(e.target.value)}
            className={["w-full bg-transparent outline-none", VALUE_TEXT_CLS].join(" ")}
            style={{ height: 25 }}
          />
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="w-full text-left"
            aria-label={label}
          >
            <span className="block" style={{ height: 25 }}>
              <span className={VALUE_TEXT_CLS}>{valueText && valueText.length > 0 ? valueText : placeholder}</span>
            </span>
          </button>
        )}

        {/*오른쪽 슬롯(드롭다운 화살표 같은 거 넣고 싶을 때)*/}
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </div>
  );
}
