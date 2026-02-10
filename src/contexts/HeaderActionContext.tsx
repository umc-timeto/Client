import { createContext, useContext } from "react";

export type HeaderActions = {
  onComplete: (() => void) | null;
  setOnComplete: (fn: (() => void) | null) => void;
};

const HeaderActionContext = createContext<HeaderActions | null>(null);

export function useHeaderActions() {
  const ctx = useContext(HeaderActionContext);
  if (!ctx) throw new Error("HeaderActionContext missing");
  return ctx;
}

export default HeaderActionContext;
