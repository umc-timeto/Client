import { api } from "@/apis/api";
import type {
  AddGoalRequest,
  AddGoalResponse,
  GoalListResponse,
  UpdateGoalRequest,
  UpdateGoalResponse,
  DeleteGoalResponse,
  GoalDto,
} from "./goal.types";

//========================
//STEP1 상태코드 성공 판정 유틸
//========================
function isOk(status: number) {
  return status >= 200 && status < 300;
}

//========================
//STEP2 서버 호출만 담당
//========================
export const goalPageApi = {
  //목표 추가
  addGoal: async (body: AddGoalRequest): Promise<GoalDto> => {
    const res = await api.post<AddGoalResponse>("/api/goals", body);
    const payload = res.data;

    //서버: { status: 201, ... }
    if (!payload || !isOk(payload.status)) {
      throw new Error(payload?.message ?? "목표 추가 실패");
    }

    return payload.data;
  },

  //목표 리스트
  getGoalList: async (): Promise<GoalDto[]> => {
    const res = await api.get<GoalListResponse>("/api/goals/list");
    const payload = res.data;

    //서버: { status: 200, data: GoalDto[] }
    if (!payload || !isOk(payload.status)) {
      throw new Error(payload?.message ?? "목표 리스트 조회 실패");
    }

    return Array.isArray(payload.data) ? payload.data : [];
  },

  //목표 수정
  updateGoal: async (goalId: number, body: UpdateGoalRequest): Promise<GoalDto | null> => {
    const res = await api.patch<UpdateGoalResponse>(`/api/goals/${goalId}`, body);
    const payload = res.data;

    if (!payload || !isOk(payload.status)) {
      throw new Error(payload?.message ?? "목표 수정 실패");
    }

    //서버가 수정 후 data를 안 줄 수도 있으니 null 허용
    return payload.data ?? null;
  },

  //목표 삭제
  deleteGoal: async (goalId: number): Promise<void> => {
    const res = await api.delete<DeleteGoalResponse>(`/api/goals/${goalId}`);
    const payload = res.data;

    if (!payload || !isOk(payload.status)) {
      throw new Error(payload?.message ?? "목표 삭제 실패");
    }
  },
};
