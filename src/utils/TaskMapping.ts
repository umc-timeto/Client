/**
 * TaskMapping 유틸
 * ------------------------------------------------------------
 * 역할:
 * - 서버 DTO(TodoSummaryDto 등) → 프론트 UI 모델(Task, UiTaskWithOrder)로 변환하는 "매핑" 전용 유틸
 * - 페이지/컴포넌트에서 변환 로직이 길어지는 걸 방지하고 재사용성을 높이기 위해 분리
 *
 * 포함 기능:
 * 1) apiPriorityToUi:
 *    - 서버 priority(HIGH/MEDIUM/LOW) → UI priority("상"/"중"/"하") 변환
 *
 * 2) UiTaskWithOrder 타입:
 *    - FolderPage에서 정렬/표시용으로 추가 데이터(_sortOrder, _startAt)를 포함한 확장 타입
 *
 * 3) toUiTaskFromSummary:
 *    - TodoSummaryDto + state(progress/complete) → UiTaskWithOrder 변환
 *    - duration 문자열은 TaskTime.parseApiDurationToMinutes로 분 단위로 변환해서 durationMinutes에 저장
 *
 * 사용 예시(간단):
 * const pRes = await taskApi.getProgressTodos(folderIdNum);
 * const uiList = (pRes.todos ?? []).map((dto) => toUiTaskFromSummary(dto, "progress"));
 * 
  //실데이터 예시
  //서버 summary(dto) 예:
  //const dto: TodoSummaryDto = {
  //  todoId: 12,
  //  name: "알고리즘 과제",
  //  duration: "1H 30M",
  //  priority: "HIGH",
  //  sortOrder: 3,
  //  startAt: "2026-02-20T10:00:00.000Z"
  //}
  //
  //toUiTaskFromSummary(dto, "progress") 결과 예:
  //{
  //  id: "12",
  //  folderId: "",
  //  title: "알고리즘 과제",
  //  durationMinutes: 90,     //parseApiDurationToMinutes("1H 30M")
  //  priority: "상",          //apiPriorityToUi("HIGH")
  //  isDone: false,           //"progress"라서 false
  //  _sortOrder: 3,
  //  _startAt: "2026-02-20T10:00:00.000Z"
  //}
 */
import type { Task } from "@/types/task";
import type { ApiPriority, ApiTodoState, TodoSummaryDto } from "@/apis/TaskPage/task.types";
import { parseApiDurationToMinutes } from "@/utils/TaskTime";

//STEP1 API priority -> UI priority
export function apiPriorityToUi(p: ApiPriority): Task["priority"] {
  if (p === "HIGH") return "상";
  if (p === "MEDIUM") return "중";
  return "하";
}

//STEP2 FolderPage에서 쓰는 UI Task 확장 타입
export type UiTaskWithOrder = Task & { _sortOrder?: number; _startAt?: string | null };

//STEP3 TodoSummaryDto -> UiTaskWithOrder
export function toUiTaskFromSummary(dto: TodoSummaryDto, state: ApiTodoState): UiTaskWithOrder {
  return {
    id: String(dto.todoId),
    folderId: "",
    title: dto.name,
    durationMinutes: parseApiDurationToMinutes(dto.duration),
    priority: apiPriorityToUi(dto.priority),
    isDone: state === "complete",
    _sortOrder: dto.sortOrder,
    _startAt: dto.startAt ?? null,
  };
}
