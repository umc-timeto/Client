import { api } from "@/apis/api";

export type TodoState = "progress" | "complete";
export type TodoPriority = "HIGH" | "MEDIUM" | "LOW";

export type TodoDetail = {
  todoId: number;
  name: string;
  duration?: string; 
  priority?: TodoPriority;
  state?: TodoState;
  startAt?: string | null;
};

type ApiResponse<T> = {
  status: number;
  code: string;
  message: string;
  data: T;
};

export const todoApi = {
  async getTodoDetail(todoId: string | number): Promise<TodoDetail> {
    const id = Number(todoId);
    if (!Number.isFinite(id)) throw new Error("Invalid todoId");

    const res = await api.get<ApiResponse<TodoDetail>>(`/api/todo/${id}`);

    if (res.data?.status !== 200) {
      throw new Error(res.data?.message ?? "Failed to fetch todo detail");
    }

    return res.data.data;
  },
};