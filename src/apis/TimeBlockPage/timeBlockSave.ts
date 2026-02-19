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

const normalizeStartAt = (v: unknown): string => {
  const raw = String(v ?? "").trim();
  if (!raw) throw new Error("startAt is required");

  const isoLike = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  if (isoLike.length >= 16) return isoLike.slice(0, 16);

  if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) return `${isoLike}T00:00`;

  throw new Error("Invalid startAt format");
};

export const timeBlockSaveApi = {
  async saveTimeBlock(
    todoId: number | string,
    body: TimeBlockSaveRequest
  ): Promise<TimeBlockSaveResponse> {
    const id = Number(todoId);
    if (!Number.isFinite(id)) throw new Error("Invalid todoId");

    const startAt = normalizeStartAt(body?.startAt);

    const res = await api.patch<TimeBlockSaveResponse>(
      `/api/block/${id}`,
      { startAt },
      { headers: { "Content-Type": "application/json" } }
    );

    const payload = res.data;

    if (!(payload?.status === 201 || payload?.status === 200)) {
      throw new Error(payload?.message || "타임블록 저장에 실패했습니다.");
    }

    return payload;
  },
};