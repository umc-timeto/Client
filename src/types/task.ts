//======================================
//UI에서 쓰는 Task 타입
//- 서버는 todo 라고 부르지만, 프론트에서는 task로 씀
//- 서버 priority: HIGH | MEDIUM | LOW
//- 서버 duration: "1H" | "1H 30M" | "30M" (문자열)
//======================================

//--------------------------------------
//UI priority (기존 UI 그대로: 상/중/하)
//--------------------------------------
export type TaskPriority = "상" | "중" | "하";

//--------------------------------------
//서버 priority
//--------------------------------------
export type ApiPriority = "HIGH" | "MEDIUM" | "LOW";

//--------------------------------------
//서버 state (진행/완료)
//--------------------------------------
export type ApiTodoState = "progress" | "complete";

//--------------------------------------
//UI Task
//--------------------------------------
export type Task = {
  id: string; // todoId를 문자열로 들고감
  folderId: string; // folderId도 문자열로 통일
  title: string; // 서버 name
  durationMinutes: number; // UI는 분 단위로 관리
  priority: TaskPriority; // UI는 상/중/하
  isDone: boolean; // state === "complete"
};

//--------------------------------------
//서버 ↔ UI priority 매핑
//--------------------------------------
export function apiPriorityToUi(p: ApiPriority): TaskPriority {
  switch (p) {
    case "HIGH":
      return "상";
    case "MEDIUM":
      return "중";
    case "LOW":
      return "하";
    default:
      return "중";
  }
}

export function uiPriorityToApi(p: TaskPriority): ApiPriority {
  switch (p) {
    case "상":
      return "HIGH";
    case "중":
      return "MEDIUM";
    case "하":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

//--------------------------------------
//서버 duration("1H 30M") ↔ UI minutes 매핑
//--------------------------------------
export function apiDurationToMinutes(duration: string): number {
  //예: "1H", "30M", "1H 30M"
  const raw = (duration ?? "").trim();
  if (!raw) return 0;

  let minutes = 0;

  //H 파싱
  const hMatch = raw.match(/(\d+)\s*H/i);
  if (hMatch?.[1]) minutes += Number(hMatch[1]) * 60;

  //M 파싱
  const mMatch = raw.match(/(\d+)\s*M/i);
  if (mMatch?.[1]) minutes += Number(mMatch[1]);

  return Number.isFinite(minutes) ? minutes : 0;
}

export function minutesToApiDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes ?? 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;

  if (h > 0 && mm > 0) return `${h}H ${mm}M`;
  if (h > 0) return `${h}H`;
  return `${mm}M`;
}

//--------------------------------------
//서버 state ↔ UI isDone
//--------------------------------------
export function apiStateToIsDone(state: ApiTodoState): boolean {
  return state === "complete";
}

export function isDoneToApiState(isDone: boolean): ApiTodoState {
  return isDone ? "complete" : "progress";
}

//--------------------------------------
//Task 생성/수정 입력(프론트 내부용)
//- TaskPage에서 payload 만들어서 api로 넘길 때 쓰는 타입
//--------------------------------------
export type TaskCreateInput = {
  folderId: string;            // UI에서는 문자열로 통일
  title: string;               // 서버 name
  durationMinutes: number;     // UI는 분 단위
  priority: TaskPriority;      // UI 상/중/하
};
