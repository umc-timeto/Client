export type GoalItem = {
  id: string;
  title: string;
  color: string;
};

const STORAGE_KEY = "timeto_goals";

export function loadGoals(): GoalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GoalItem[];
  } catch {
    return [];
  }
}

export function saveGoals(goals: GoalItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}
