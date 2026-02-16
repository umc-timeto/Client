export type FolderItem = {
  id: string;
  goalId: string;
  name: string;
  todoCount: number;
  order: number; //목표 내 순서
};

const STORAGE_KEY = "timeto_folders";

function loadAll(): FolderItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FolderItem[];
  } catch {
    return [];
  }
}

function saveAll(next: FolderItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function makeId() {
  return `f_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getFoldersByGoal(goalId: string): FolderItem[] {
  return loadAll()
    .filter((f) => f.goalId === goalId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function createFolder(goalId: string, name: string): FolderItem {
  const all = loadAll();
  const inGoal = all.filter((f) => f.goalId === goalId);
  const maxOrder = inGoal.reduce((m, f) => Math.max(m, f.order ?? 0), 0);

  const next: FolderItem = {
    id: makeId(),
    goalId,
    name,
    todoCount: 0,
    order: maxOrder + 1,
  };

  saveAll([...all, next]);
  return next;
}

export function deleteFoldersByGoal(goalId: string) {
  const all = loadAll();
  saveAll(all.filter((f) => f.goalId !== goalId));
}

export function bumpTodoCount(folderId: string, delta: number) {
  const all = loadAll();
  const idx = all.findIndex((f) => f.id === folderId);
  if (idx < 0) return;

  const cur = all[idx];
  const nextCount = Math.max(0, (cur.todoCount ?? 0) + delta);
  all[idx] = { ...cur, todoCount: nextCount };
  saveAll(all);
}
