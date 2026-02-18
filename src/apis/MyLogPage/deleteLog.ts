
import { api } from "@/apis/api";

export type DeleteLogResponse = {
  status: number;
  code: string;
  message: string;
  data: null;
};

export const deleteLogApi = {
  async deleteLog(logId: number | string): Promise<DeleteLogResponse> {
    const res = await api.delete<DeleteLogResponse>(`/api/logs/${logId}`);

    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "일지 삭제에 실패했습니다.");
    }

    return payload;
  },
};