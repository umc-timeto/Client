//C:\Users\tndus\Client\src\pages\HomePage\mock.ts
export type GoalItem = {
  id: string;
  title: string; //UI 표시용
  color: string; //hex (#F6AE14 등)
};

const STORAGE_KEY = "timeto_goals";

//hex -> folder color token key 매핑(10개 고정)
export function getFolderColorKeyByHex(hex: string) {
  const v = (hex ?? "").toUpperCase();
  if (v === "#FF8373") return "red";
  if (v === "#F6AE14") return "orange";
  if (v === "#FFE240") return "yellow";
  if (v === "#D5F05F") return "lightGreen";
  if (v === "#75C7AD") return "green";
  if (v === "#FF9FD4") return "pink";
  if (v === "#C58BFF") return "purple";
  if (v === "#638FFF") return "blue";
  if (v === "#6FB7FF") return "skyBlue";
  if (v === "#8AE6EE") return "cyan";
  return null;
}

export function getFolderNormalVar(hex: string) {
  const key = getFolderColorKeyByHex(hex);
  if (!key) return hex;
  return `var(--color-folder-${key}-nomal)`;
}

export function getFolderLightVar(hex: string) {
  const key = getFolderColorKeyByHex(hex);
  if (!key) return "rgba(0,0,0,0.03)";
  return `var(--color-folder-${key}-light)`;
}

//로컬스토리지 데이터 로드(구버전{name,color}도 호환)
export function loadGoals(): GoalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((it: any, idx: number) => {
        const title =
          typeof it?.title === "string"
            ? it.title
            : typeof it?.name === "string"
              ? it.name
              : "";
        const color =
          typeof it?.color === "string"
            ? it.color
            : typeof it?.colorHex === "string"
              ? it.colorHex
              : "";
        const id =
          typeof it?.id === "string" && it.id.length > 0
            ? it.id
            : typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${idx}`;

        if (!title || !color) return null;
        return { id, title, color } as GoalItem;
      })
      .filter(Boolean) as GoalItem[];
  } catch {
    return [];
  }
}

export function saveGoals(goals: GoalItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export function deleteGoal(goalId: string) {
  const prev = loadGoals();
  const next = prev.filter((g) => g.id !== goalId);
  saveGoals(next);
}

// -----------------------------
// Folder Dummy Data
// -----------------------------

export type FolderItem = {
  id: string;
  goalId: string;   // 어떤 목표에 속하는지
  name: string;
};

export function loadDummyFolders(): FolderItem[] {
  return [
    {
      id: "folder-1",
      goalId: "goal-1",
      name: "기초 개념 정리",
    },
    {
      id: "folder-2",
      goalId: "goal-1",
      name: "실전 문제 풀이",
    },
    {
      id: "folder-3",
      goalId: "goal-2",
      name: "상체 운동",
    },
  ];
}
