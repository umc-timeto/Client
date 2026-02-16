import type { ReactNode, CSSProperties } from "react";

type Props = {
  title: string;
  sub?: string;
  selected?: boolean;
  onClick: () => void;
  right?: ReactNode;
  left?: ReactNode;
  selectedBgClassName?: string;
  selectedBgStyle?: CSSProperties;
  className?: string;
  titleClassName?: string;
  subClassName?: string;
  subWrapperClassName?: string;
};

export default function SelectRow({
  title,
  sub,
  selected,
  onClick,
  right,
  left,
  selectedBgClassName,
  selectedBgStyle,
  className,
  titleClassName,
  subClassName,
  subWrapperClassName,
}: Props) {
  const isSelected = !!selected;

  return (
    <button
      type="button"
      onClick={onClick}
      style={isSelected ? selectedBgStyle : undefined}
      className={`gap-5 flex w-full cursor-pointer items-center justify-between rounded-lg py-4 pl-5 pr-3.75 text-left text-[16px] font-semibold transition-colors ${
        isSelected ? selectedBgClassName ?? "" : ""
      } ${className ?? ""}`}
    >
      {left ? <div className="shrink-0">{left}</div> : null}
      <div className="flex flex-col grow">
        <div className={`${titleClassName ?? "text-grey-dark text-[16px]"} leading-[1.4]`}>{title}</div>
        {sub ? (
          <div className={`${subWrapperClassName ?? "mt-1"} text-[13px] leading-[1.4] font-normal ${subClassName ?? "text-grey-normal"}`}>{sub}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </button>
  );
}