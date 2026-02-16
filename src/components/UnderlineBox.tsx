import type { ReactNode } from "react";

type Props = {
  label: string;
  active: boolean; //값이 있거나 선택된 상태면 true
  focused?: boolean; //포커스 상태면 true
  accentColor?: string; //포커스 색상(기본:#F7941D)

  valueText?: string; //button 모드에서 보여줄 텍스트
  placeholder?: string; //값 없을 때 보여줄 공백/placeholder
  mode: "input" | "button";

  //input용
  inputValue?: string;
  onInputChange?: (v: string) => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;

  //button용
  onClick?: () => void;

  //확장 슬롯
  leftSlot?: ReactNode; //값 영역 왼쪽 슬롯(색상 점 등)
  rightSlot?: ReactNode; //값 영역 오른쪽 슬롯(드롭다운 화살표 등)
};

//피그마값(입력/선택 텍스트): #0F0F0F / 22px / 600 / H=25
const VALUE_TEXT_CLS =
  "font-pretendard text-[22px] font-semibold leading-[25px]";

export default function FormFieldUnderline({
  label,
  active,
  focused = false,
  accentColor = "#F7941D",
  valueText,
  placeholder = " ",
  mode,
  inputValue,
  onInputChange,
  onInputFocus,
  onInputBlur,
  onClick,
  leftSlot,
  rightSlot,
}: Props) {
  //STEP1 상태 기반 컬러 결정(빈값:회색, 포커스:주황, 값있음:검정)
  const labelColor = active ? "text-gray-700" : focused ? "" : "text-gray-300";
  const borderColor = active ? "border-gray-700" : focused ? "" : "border-gray-200";
  const valueColor = active ? "text-gray-700" : focused ? "" : "text-gray-300";
  const caretColor = active ? "#0F0F0F" : focused ? accentColor : "#A5A5A5";

  return (
    <div>
      {/*라벨*/}
      <div
        className={[
          "font-pretendard text-[13px] font-medium leading-normal",
          labelColor,
        ].join(" ")}
        style={focused && !active ? { color: accentColor } : undefined}
      >
        {label}
      </div>

      {/*밑줄 영역*/}
      <div
        className={[
          "mt-3 w-full border-b pb-2 flex items-center gap-2",
          borderColor,
        ].join(" ")}
        style={focused && !active ? { borderColor: accentColor } : undefined}
      >
        {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}

        {mode === "input" ? (
          <input
            value={inputValue ?? ""}
            onChange={(e) => onInputChange?.(e.target.value)}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            className={[
              "w-full bg-transparent outline-none",
              VALUE_TEXT_CLS,
              valueColor,
            ].join(" ")}
            style={{ height: 25, caretColor }}
          />
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="w-full text-left"
            aria-label={label}
          >
            <span className="block" style={{ height: 25 }}>
              <span
                className={[VALUE_TEXT_CLS, valueColor].join(" ")}
                style={focused && !active ? { color: accentColor } : undefined}
              >
                {valueText && valueText.length > 0 ? valueText : placeholder}
              </span>
            </span>
          </button>
        )}

        {/*오른쪽 슬롯*/}
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </div>
  );
}
