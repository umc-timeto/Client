import { api } from "@/apis/api";

export type Satisfaction = "GREAT" | "SOSO" | "BAD";

export type MonthlyLogItem = {
  logId: number;
  date: string; 
  satisfaction: Satisfaction;
};

type MonthlyLogsResponse = {
  status: number;
  code: string;
  message: string;
  data: MonthlyLogItem[];
};

export const monthlyLogsApi = {
  async getMonthlyLogs(params: { year: number; month: number }): Promise<MonthlyLogItem[]> {
    const res = await api.get<MonthlyLogsResponse>("/api/logs/monthly", { params });

    const payload = res.data;
    if (payload?.status !== 200) {
      throw new Error(payload?.message || "월별 일지 조회에 실패했습니다.");
    }

    return payload.data ?? [];
  },
};