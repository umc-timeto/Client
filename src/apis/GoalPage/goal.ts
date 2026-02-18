

/**
 * goalApi 사용 예시
 *
 * import { goalApi } from "@/apis/GoalPage/goal";
 *
 * async function fetchGoals() {
 *   try {
 *     const goals = await goalApi.getGoalList();
 *     console.log("목표 리스트:", goals);
 *   } catch (error) {
 *     console.error("목표 리스트 조회 실패:", error);
 *   }
 * }
 *
 * - getGoalList()는 서버에서 인증된 사용자의 목표 리스트를 조회합니다.
 * - 성공 시 GoalItem[] 배열을 반환합니다.
 * - status가 200이 아니면 Error를 throw 합니다.
 */

import { api } from "@/apis/api";

export type GoalItem = {
  id: number;
  name: string;
  color: string;
};

export type GoalListResponse = {
  status: number;
  code: string;
  message: string;
  data: GoalItem[];
};

export const goalApi = {
  getGoalList: async (): Promise<GoalItem[]> => {
    const res = await api.get<GoalListResponse>("/api/goals/list");

    const payload = res.data;
    if (!payload || payload.status !== 200) {
      throw new Error(payload?.message ?? "Failed to load goal list");
    }

    return payload.data ?? [];
  },

  //========================
  //STEP1 추가 API(스웨거 기준)
  //-기존 getGoalList()는 수정하지 않고 유지
  //-새로 추가되는 함수만 사용하면 됨
  //========================

  //STEP2 목표 추가
  addGoal: async (body: GoalCreateRequest): Promise<GoalItem> => {
    const res = await api.post<GoalAddResponse>("/api/goals", body);

    const payload = res.data;
    if (!payload || payload.status !== 201) {
      throw new Error(payload?.message ?? "Failed to add goal");
    }

    return payload.data;
  },

  //STEP3 목표 변경
  updateGoal: async (goalId: number, body: GoalUpdateRequest): Promise<GoalItem> => {
    const res = await api.patch<GoalUpdateResponse>(`/api/goals/${goalId}`, body);

    const payload = res.data;
    if (!payload?.isSuccess) {
      throw new Error(payload?.message ?? "Failed to update goal");
    }

    return payload.result;
  },

  //STEP4 목표 삭제
  deleteGoal: async (goalId: number): Promise<void> => {
    const res = await api.delete<GoalDeleteResponse>(`/api/goals/${goalId}`);

    const payload = res.data;
    //STEP4-1 삭제 응답은 data:null 형태(스웨거 캡처 기준)
    if (!payload || payload.status !== 200) {
      throw new Error(payload?.message ?? "Failed to delete goal");
    }
  },

  //STEP5 목표 리스트(스웨거 캡처 기준: isSuccess/result/goals)
  //-팀장님 getGoalList()와 응답 스키마가 다르므로 별도 함수로 제공
  getGoalListSwagger: async (): Promise<GoalItem[]> => {
    const res = await api.get<GoalListSwaggerResponse>("/api/goals/list");

    const payload = res.data;
    if (!payload?.isSuccess) {
      throw new Error(payload?.message ?? "Failed to load goal list");
    }

    return payload.result?.goals ?? [];
  },
};

//========================
//STEP6 요청/응답 타입(추가된 함수용)
//========================

//STEP6-1 목표 추가 요청 바디
export type GoalCreateRequest = {
  name: string;
  color: string;
};

//STEP6-2 목표 변경 요청 바디
export type GoalUpdateRequest = {
  name: string;
  color: string;
};

//STEP6-3 목표 추가 응답(스웨거 캡처: status/code/message/data)
export type GoalAddResponse = {
  status: number; //201
  code: string;
  message: string;
  data: GoalItem;
};

//STEP6-4 목표 리스트 응답(스웨거 캡처: isSuccess/code/message/result.goals[])
export type GoalListSwaggerResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    goals: GoalItem[];
  };
};

//STEP6-5 목표 변경 응답(스웨거 캡처: isSuccess/code/message/result)
export type GoalUpdateResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: GoalItem;
};

//STEP6-6 목표 삭제 응답(스웨거 캡처: status/code/message/data:null)
export type GoalDeleteResponse = {
  status: number; //200
  code: string;
  message: string;
  data: null;
};
