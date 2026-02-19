import { api } from "@/apis/api";

export type TimeBlockMoveResponse = {
  status: number;
  code: string;
  message: string;
  data?: unknown;
};

export const timeBlockMoveApi = {
  async moveBlock(blockId: number | string, startAt: string): Promise<TimeBlockMoveResponse> {
    const url = `/api/block/${blockId}/move?startAt=${encodeURIComponent(startAt)}`;
    const res = await api.patch<TimeBlockMoveResponse>(url, undefined);
    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "블록 이동에 실패했습니다.");
    }

    return payload;
  },
};