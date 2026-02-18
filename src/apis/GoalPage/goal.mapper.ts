import type { GoalDto } from "./goal.types";

//========================
//STEP1 화면용 모델(기존 코드 호환)
//========================
export type GoalUiItem = {
  id: string;
  title: string;
  color: string;
};

//========================
//STEP2 DTO -> UI 변환
//========================
export function toGoalUiItem(dto: GoalDto): GoalUiItem {
  return {
    id: String(dto.id),
    title: dto.name,
    color: dto.color,
  };
}
