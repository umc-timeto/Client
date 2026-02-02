import React from "react";

type HeaderIconButtonProps = {
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function HeaderIconButton({
  ariaLabel,
  onClick,
  disabled,
  children,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={"inline-flex h-10 w-10 items-center justify-center"}
    >
      {children}
    </button>
  );
}