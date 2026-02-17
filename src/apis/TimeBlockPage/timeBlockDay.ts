import { api } from "@/apis/api";
import type { ColorKey } from "@/constants/timeBlockCreateStore";

export type TimeBlockDayItem = {
  blockId: number;
  todoId: number;
  startAt: string; 
  endAt: string;  
  todoName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  state: "progress" | "complete";
  goalName?: string;
  color?: ColorKey | string; 
};

export type TimeBlockDayResponse = {
  status: number;
  code: string;
  message: string;
  data: TimeBlockDayItem[];
};

export const timeBlockDayApi = {
  async getTimeBlocksByDay(date: string): Promise<TimeBlockDayItem[]> {
    const res = await api.get<TimeBlockDayResponse>("/api/block/day", {
      params: { date },
      headers: { Accept: "application/json" },
    });

    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "날짜별 타임블록 조회에 실패했습니다.");
    }

    return payload.data ?? [];
  },
};