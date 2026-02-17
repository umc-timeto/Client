import { api } from "@/apis/api";

export type TodoStatusState = "progress" | "complete";

export type TodoStatusRequest = {
  state: TodoStatusState;
};

export type TodoStatusResponse = {
  status: number;
  code: string;
  message: string;
  data?: {
    todoId?: number;
    state?: TodoStatusState | string;
  };
};

export const todoStatusApi = {
  async updateTodoStatus(
    todoId: number | string,
    body: TodoStatusRequest
  ): Promise<TodoStatusResponse> {
    const res = await api.patch<TodoStatusResponse>(`/api/todo/status/${todoId}`, body, {
      headers: { "Content-Type": "application/json" },
    });

    const payload = res.data;

    if (payload?.status !== 200) {
      throw new Error(payload?.message || "할 일 상태 변경에 실패했습니다.");
    }

    return payload;
  },
};