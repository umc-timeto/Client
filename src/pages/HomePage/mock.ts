//C:\Users\tndus\Client\src\pages\HomePage\mock.ts
export type GoalItem = {
  id: string;
  name: string;
  color: string;
};

const STORAGE_KEY = "timeto_goals";

//STEP1 로컬스토리지 데이터 로드(구버전 title/color, name/color 모두 호환)
export function loadGoals(): GoalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((it: any, idx: number) => {
        const name =
          typeof it?.name === "string"
            ? it.name
            : typeof it?.title === "string"
              ? it.title
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
            : typeof crypto !== "undefined"
              ? crypto.randomUUID()
              : `${Date.now()}-${idx}`;

        if (!name || !color) return null;
        return { id, name, color } as GoalItem;
      })
      .filter(Boolean) as GoalItem[];
  } catch {
    return [];
  }
}

//STEP2 로컬스토리지 데이터 저장
export function saveGoals(goals: GoalItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}
