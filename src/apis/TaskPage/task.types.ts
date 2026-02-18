//========================
//Task(Todo) API Types
//- Swagger 명세 기준
//- API는 todo 라고 부르지만, 프론트에서는 task로 다룸
//========================

export type ApiPriority = "HIGH" | "MEDIUM" | "LOW";
export type ApiTodoState = "progress" | "complete";

//------------------------------
//공통 응답 래퍼
//------------------------------
export type ApiResponse<T> = {
  status: number;
  code: string;
  message: string;
  data: T;
};

//------------------------------
//요청 바디
//------------------------------
export type AddTodoRequest = {
  name: string;
  priority: ApiPriority;
  duration: string; // "1H" | "1H 30M" | "30M"
};

export type UpdateTodoRequest = {
  name: string;
  priority: ApiPriority;
  duration: string; // "1H" | "1H 30M" | "30M"
};

export type UpdateTodoStatusRequest = {
  state: ApiTodoState;
};

//------------------------------
//응답 DTO
//------------------------------
export type AddTodoResponseData = {
  todoId: number;
};

export type TodoDetailDto = {
  todoId: number;
  name: string;
  duration: string; // "1H 30M" 같은 문자열
  priority: ApiPriority;
  state: ApiTodoState;
  startAt?: string; // ISO string (있을 수도/없을 수도)
};

export type UpdateTodoResponseData = TodoDetailDto;

export type DeleteTodoResponseData = string;

//상태 변경 응답
export type UpdateTodoStatusResponseData = {
  todoId: number;
  //스웨거 예시가 string이라 안전하게 union
  state: ApiTodoState | string;
};

//------------------------------
//리스트 응답 (진행/완료)
//------------------------------
//스웨거에서 todos 배열 아이템은 todoId/name/priority/duration/startAt 만 있음
export type TodoSummaryDto = {
  todoId: number;
  name: string;
  priority: ApiPriority;
  duration: string;
  startAt?: string;
  sortOrder?: number;
};

export type TodoListResponseData = {
  count: number;
  todos: TodoSummaryDto[];
};

//------------------------------
//unblocked 리스트 (data가 배열)
//------------------------------
export type UnblockedTodoListResponseData = TodoDetailDto[];

//========================
//Duration 변환 유틸
//- API duration: "1H" | "1H 30M" | "30M"
//- UI minutes: number (예: 90)
//========================
export function minutesToApiDuration(totalMinutes: number) {
  const m = Math.max(0, Math.floor(totalMinutes || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;

  if (h > 0 && mm > 0) return `${h}H ${mm}M`;
  if (h > 0) return `${h}H`;
  return `${mm}M`;
}

export function apiDurationToMinutes(duration: string) {
  if (!duration) return 0;

  // ex) "1H 30M", "1H", "30M"
  const hMatch = duration.match(/(\d+)\s*H/i);
  const mMatch = duration.match(/(\d+)\s*M/i);

  const h = hMatch ? Number(hMatch[1]) : 0;
  const m = mMatch ? Number(mMatch[1]) : 0;

  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, h * 60 + m);
}

//========================
//Priority 변환 유틸
//- UI(상/중/하) <-> API(HIGH/MEDIUM/LOW)
//========================
export type UiPriorityKor = "상" | "중" | "하";

export function uiPriorityToApi(p: UiPriorityKor): ApiPriority {
  if (p === "상") return "HIGH";
  if (p === "중") return "MEDIUM";
  return "LOW";
}

export function apiPriorityToUi(p: ApiPriority): UiPriorityKor {
  if (p === "HIGH") return "상";
  if (p === "MEDIUM") return "중";
  return "하";
}

export type UpdateTodoOrderRequest = {
  targetOrder: number;
};

export type UpdateTodoOrderResponseData = {
  todoId: number;
  sortOrder: number;
};