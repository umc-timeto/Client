import { api } from "@/apis/api";

export type WithdrawResponse = {
  status: number;
  code: string;
  message: string;
  data?: string;
};

export const withdrawApi = {
  async withdraw(): Promise<WithdrawResponse> {
    const res = await api.delete<WithdrawResponse>("/api/auth/delete");

    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "회원탈퇴에 실패했습니다.");
    }

    return payload;
  },
};