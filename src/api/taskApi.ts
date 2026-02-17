import type { Task, TaskCreateInput } from "@/types/task";
import { setFolderTodoCount } from "@/api/folderApi";

//폴더 선택 기능 붙기 전 임시 기본값(지금은 전부 f1로 들어감)
const DEFAULT_FOLDER_ID = "f1";
const STORAGE_KEY = "timeto.tasks";

function loadTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

//STEP1 진행 개수 계산
function getProgressCountByFolder(tasks: Task[], folderId: string) {
  return tasks.filter((t) => t.folderId === folderId && !t.isDone).length;
}

//앱 최초 1회: mock.ts에 있는 초기 더미를 localStorage에 심어두기
export function ensureMockSeed(initial: Task[]) {
  const cur = loadTasks();
  if (cur.length > 0) return;
  saveTasks(initial);
}

export async function getTasksByFolder(folderId: string): Promise<Task[]> {
  const tasks = loadTasks();
  return tasks.filter((t) => t.folderId === folderId);
}

//POST 모양새(나중에 fetch로 교체)
export async function createTask(input: TaskCreateInput): Promise<Task> {
  const tasks = loadTasks();

  const folderId = input.folderId ?? DEFAULT_FOLDER_ID;

  const newTask: Task = {
    id: makeId(),
    folderId,
    title: input.title,
    durationMinutes: input.durationMinutes,
    priority: input.priority,
    isDone: false,
  };

  tasks.push(newTask);
  saveTasks(tasks);

  //STEP2 진행 개수 덮어쓰기
  setFolderTodoCount(folderId, getProgressCountByFolder(tasks, folderId));

  await new Promise((r) => setTimeout(r, 150));
  return newTask;
}

//========================
//폴더 task 순서/상태 저장
//========================
export async function setTasksByFolder(folderId: string, next: Task[]): Promise<void> {
  const all = loadTasks();
  const others = all.filter((t) => t.folderId !== folderId);

  //STEP1 folderId 강제 정규화
  const normalized = next.map((t) => ({ ...t, folderId }));

  const merged = [...others, ...normalized];
  saveTasks(merged);

  //STEP2 진행 개수 덮어쓰기
  setFolderTodoCount(folderId, getProgressCountByFolder(merged, folderId));

  await new Promise((r) => setTimeout(r, 80));
}

//========================
//STEP 1: 단건 조회
//========================
export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = loadTasks();
  return tasks.find((t) => t.id === taskId) ?? null;
}

//========================
//STEP 1: 수정
//========================
export async function updateTask(
  taskId: string,
  patch: Partial<Omit<Task, "id" | "folderId">>
): Promise<Task | null> {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;

  const base = tasks[idx];
  const updated: Task = { ...base, ...patch, id: taskId, folderId: base.folderId };

  tasks[idx] = updated;
  saveTasks(tasks);

  //STEP2 진행 개수 덮어쓰기
  setFolderTodoCount(base.folderId, getProgressCountByFolder(tasks, base.folderId));

  await new Promise((r) => setTimeout(r, 120));
  return updated;
}

//========================
//STEP 1: 삭제
//========================
export async function deleteTask(taskId: string): Promise<boolean> {
  const tasks = loadTasks();
  const target = tasks.find((t) => t.id === taskId) ?? null;

  const next = tasks.filter((t) => t.id !== taskId);
  if (next.length === tasks.length) return false;

  saveTasks(next);

  //STEP2 진행 개수 덮어쓰기
  if (target) {
    setFolderTodoCount(target.folderId, getProgressCountByFolder(next, target.folderId));
  }

  await new Promise((r) => setTimeout(r, 120));
  return true;
}