import type { Task, TaskPriority } from "@/types/task";
import type { ApiPriority, TodoDetailDto, TodoSummaryDto } from "./task.types";

//========================
//duration: minutes <-> "1H 30M" / "1H" / "30M"
//========================
export function minutesToApiDuration(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes ?? 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;

  if (h > 0 && mm > 0) return `${h}H ${mm}M`;
  if (h > 0) return `${h}H`;
  return `${mm}M`;
}

export function apiDurationToMinutes(duration: string): number {
  if (!duration) return 0;

  const s = String(duration).trim().toUpperCase().replace(/\s+/g, " ");

  //딱 맞는 포맷들:
  //- "1H 30M"
  //- "1H"
  //- "30M"
  //- "0H 30M" 같은 것도 일단 허용
  let hours = 0;
  let minutes = 0;

  const hMatch = s.match(/(\d+)\s*H/);
  const mMatch = s.match(/(\d+)\s*M/);

  if (hMatch) hours = Number(hMatch[1]);
  if (mMatch) minutes = Number(mMatch[1]);

  if (!Number.isFinite(hours)) hours = 0;
  if (!Number.isFinite(minutes)) minutes = 0;

  return Math.max(0, hours * 60 + minutes);
}

//========================
//priority: UI("상/중/하") <-> API("HIGH/MEDIUM/LOW")
//========================
export function apiPriorityToUi(p: ApiPriority): TaskPriority {
  if (p === "HIGH") return "상";
  if (p === "MEDIUM") return "중";
  return "하";
}

export function uiPriorityToApi(p: TaskPriority): ApiPriority {
  if (p === "상") return "HIGH";
  if (p === "중") return "MEDIUM";
  return "LOW";
}

//========================
//DTO -> UI Task
//========================
export function todoSummaryToTask(dto: TodoSummaryDto, folderId: string, isDone: boolean): Task {
  return {
    id: String(dto.todoId),
    folderId,
    title: dto.name,
    durationMinutes: apiDurationToMinutes(dto.duration),
    priority: apiPriorityToUi(dto.priority),
    isDone,
  };
}

export function todoDetailToTask(dto: TodoDetailDto, folderId: string): Task {
  return {
    id: String(dto.todoId),
    folderId,
    title: dto.name,
    durationMinutes: apiDurationToMinutes(dto.duration),
    priority: apiPriorityToUi(dto.priority),
    isDone: dto.state === "complete",
  };
}
