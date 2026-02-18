import React from "react";

export type HeaderBaseProps = {
  title: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export function HeaderBase({ title, left, right }: HeaderBaseProps) {
  return (
    <header className={`sticky top-0 pt-17.5 z-50 flex items-center justify-between pl-[13.33px] pr-5 bg-white`}>
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex flex-none items-center justify-start" aria-label="header-left">
        {left}
      </div>

      <h1
        className="mx-0 flex-1 text-center text-[20px] font-semibold"
        aria-label="header-title"
      >
        {title}
      </h1>

      <div className="flex flex-none items-center justify-end " aria-label="header-right">
        {right}
      </div>
    </header>
  );
}

export function StatusHeaderBase({ title, left, right }: HeaderBaseProps) {
  return (
    <div className={`sticky top-0 pt-17.5 z-50 bg-white`}>
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex flex-none items-center justify-start" aria-label="header-left">
          {left}
        </div>

        <h1
          className="mx-0 flex-1 text-center text-[20px] font-semibold"
          aria-label="header-title"
        >
          {title}
        </h1>

        <div className="flex flex-none items-center justify-end" aria-label="header-right">
          {right}
        </div>
      </div>
    </div>
  );
}