//C:\Users\tndus\Client\src\apis\GoalPage\goal.api.ts
import { api } from "@/apis/api";
import type {
  AddGoalRequest,
  AddGoalResponse,
  GoalListSwaggerResponse,
  UpdateGoalRequest,
  UpdateGoalResponse,
  DeleteGoalResponse,
  GoalDto,
} from "./goal.types";

//========================
//STEP1 서버 호출만 담당
//========================
export const goalPageApi = {
  //STEP2 목표 추가
  addGoal: async (body: AddGoalRequest): Promise<GoalDto> => {
    const res = await api.post<AddGoalResponse>("/api/goals", body);
    const payload = res.data;

    if (!payload || payload.status !== 201) {
      throw new Error(payload?.message ?? "Failed to add goal");
    }

    return payload.data;
  },

  //STEP3 목표 리스트(스웨거 캡처: isSuccess/result/goals)
  getGoalList: async (): Promise<GoalDto[]> => {
    const res = await api.get<GoalListSwaggerResponse>("/api/goals/list");
    const payload = res.data;

    if (!payload?.isSuccess) {
      throw new Error(payload?.message ?? "Failed to load goal list");
    }

    return payload.result?.goals ?? [];
  },

  //STEP4 목표 수정
  updateGoal: async (goalId: number, body: UpdateGoalRequest): Promise<GoalDto> => {
    const res = await api.patch<UpdateGoalResponse>(`/api/goals/${goalId}`, body);
    const payload = res.data;

    if (!payload?.isSuccess) {
      throw new Error(payload?.message ?? "Failed to update goal");
    }

    return payload.result;
  },

  //STEP5 목표 삭제(스웨거 캡처: status/code/message/data:null)
  deleteGoal: async (goalId: number): Promise<void> => {
    const res = await api.delete<DeleteGoalResponse>(`/api/goals/${goalId}`);
    const payload = res.data;

    if (!payload || payload.status !== 200) {
      throw new Error(payload?.message ?? "Failed to delete goal");
    }
  },
};
