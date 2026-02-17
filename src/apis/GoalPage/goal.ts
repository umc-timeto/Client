

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
};
