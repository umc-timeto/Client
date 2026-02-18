import { api } from "@/apis/api";

export type TimeBlockSaveRequest = {
  startAt: string;
};

export type TimeBlockSaveResponse = {
  status: number;
  code: string;
  message: string;
  data?: unknown;
};

export const timeBlockSaveApi = {
  async saveTimeBlock(todoId: number | string, body: TimeBlockSaveRequest): Promise<TimeBlockSaveResponse> {
    const res = await api.patch<TimeBlockSaveResponse>(`/api/block/${todoId}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const payload = res.data;

    if (!(payload?.status === 201 || payload?.status === 200)) {
      throw new Error(payload?.message || "타임블록 저장에 실패했습니다.");
    }

    return payload;
  },
};
