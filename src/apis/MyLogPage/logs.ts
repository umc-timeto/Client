import { api } from "@/apis/api";

export type Satisfaction = "GREAT" | "SOSO" | "BAD";
export type Achievement = "PERFECT" | "MOSTLY" | "HALF" | "SOMEWHAT" | "DIFFERENT";

export type CreateLogRequest = {
  /** YYYY-MM-DD */
  date: string;
  answer1: Satisfaction;
  answer2: Achievement;
  /** null 허용 */
  answer3: string | null;
};

export type UpdateLogRequest = {
  /** YYYY-MM-DD */
  date: string;
  answer1: Satisfaction;
  answer2: Achievement;
  /** null 허용 */
  answer3: string | null;
};

export type CreateLogResponse = {
  status: number;
  code: string;
  message: string;
  data?: unknown;
};

export const logsApi = {
  async createLog(body: CreateLogRequest): Promise<CreateLogResponse> {
    const res = await api.post<CreateLogResponse>("/api/logs", body, {
      headers: { "Content-Type": "application/json" },
    });

    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "일지 등록에 실패했습니다.");
    }

    return payload;
  },

  async updateLog(logId: number, body: UpdateLogRequest): Promise<CreateLogResponse> {
    const res = await api.patch<CreateLogResponse>(`/api/logs/${logId}`,
      body,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "일지 수정에 실패했습니다.");
    }

    return payload;
  },
};