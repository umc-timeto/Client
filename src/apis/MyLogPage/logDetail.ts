import { api } from "@/apis/api";
import type { Satisfaction, Achievement } from "@/apis/MyLogPage/logs";

export type LogDetail = {
  logId: number;
  answer1: Satisfaction | null;
  answer2: Achievement | null;
  answer3: string | null;
};

export type GetLogDetailResponse = {
  status: number;
  code: string;
  message: string;
  data: LogDetail;
};

export const logDetailApi = {
  async getLogDetail(logId: number | string): Promise<LogDetail> {
    const res = await api.get<GetLogDetailResponse>(`/api/logs/${logId}`);
    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "일지 조회에 실패했습니다.");
    }

    return payload.data;
  },
};