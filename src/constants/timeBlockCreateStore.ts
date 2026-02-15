import { create } from "zustand";

export type ColorKey =
  | "red"
  | "orange"
  | "yellow"
  | "lightGreen"
  | "green"
  | "cyan"
  | "skyBlue"
  | "blue"
  | "purple"
  | "pink";

export type TaskLevel = "high" | "mid" | "low";

export type GoalItem = {
  id: string;
  title: string;
  colorKey?: ColorKey;
};

export type FolderItem = {
  id: string;
  title: string;
  goalId: string;
};

export type TaskItem = {
  id: string;
  title: string;
  folderId: string;
  minutes?: number; // 예상 소요시간 등
  colorKey?: ColorKey;
  level?: TaskLevel;
};

type State = {
  targetDateYmd: string | null;
  pickedGoal: GoalItem | null;
  pickedFolder: FolderItem | null;
  pickedTask: TaskItem | null;

  setTargetDateYmd: (ymd: string) => void;
  setGoal: (g: GoalItem) => void;
  setFolder: (f: FolderItem) => void;
  setTask: (t: TaskItem | null) => void;

  reset: () => void;
};

export const useTimeBlockCreateStore = create<State>((set) => ({
  targetDateYmd: null,
  pickedGoal: null,
  pickedFolder: null,
  pickedTask: null,

  setTargetDateYmd: (ymd) =>
    set(() => ({
      targetDateYmd: ymd,
    })),

  setGoal: (g) =>
    set(() => ({
      pickedGoal: g,
      pickedFolder: null,
      pickedTask: null,
    })),

  setFolder: (f) =>
    set(() => ({
      pickedFolder: f,
      pickedTask: null,
    })),

  setTask: (t) => set(() => ({ pickedTask: t })),

  reset: () =>
    set(() => ({
      targetDateYmd: null,
      pickedGoal: null,
      pickedFolder: null,
      pickedTask: null,
    })),
}));