import type { Task, TaskCreateInput } from "@/types/task";
import { MOCK_FOLDER_ID } from "@/pages/TaskPage/mock";

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

  const newTask: Task = {
    id: makeId(),
    folderId: input.folderId ?? MOCK_FOLDER_ID,
    title: input.title,
    durationMinutes: input.durationMinutes,
    priority: input.priority,
    isDone: false,
  };

  tasks.unshift(newTask);
  saveTasks(tasks);

  console.log("📦 createTask payload:", input); //저장 됐는지 확인용

  //네트워크 흉내(없어도 되는데, 동작 확인용)
  await new Promise((r) => setTimeout(r, 150));

  return newTask;
}
