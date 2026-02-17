import { api } from "@/apis/api";

export type CommonResponse<T> = {
  status: number;
  code: string;
  message: string;
  data: T;
};

export type TodoPriority = "HIGH" | "MEDIUM" | "LOW";
export type TodoState = "progress" | "complete";

export type TodoDetail = {
  todoId: number;
  name: string;
  duration: string;
  priority: TodoPriority;
  state: TodoState;
  startAt: string;
};

export type UnblockedTodoItem = {
  todoId: number;
  name: string;
  duration: string;
  priority: TodoPriority;
  state: TodoState;
  startAt: string;
};

export const taskApi = {
  async getTodoDetail(todoId: number | string): Promise<TodoDetail> {
    const id = Number(todoId);
    if (!Number.isFinite(id)) throw new Error("Invalid todoId");

    const res = await api.get<CommonResponse<TodoDetail>>(`/api/todo/${id}`);
    const payload = res.data;

    if (payload?.status !== 200) throw new Error(payload?.message ?? "Failed to fetch todo detail");

    return payload.data;
  },
  async getUnblockedTodoList(folderId: number | string): Promise<UnblockedTodoItem[]> {
    const id = Number(folderId);
    if (!Number.isFinite(id)) throw new Error("Invalid folderId");

    const res = await api.get<CommonResponse<UnblockedTodoItem[]>>(`/api/todo/${id}/todo/unblocked`);
    const payload = res.data;

    if (payload?.status !== 200) throw new Error(payload?.message ?? "Failed to fetch unblocked todo list");

    return payload.data;
  },
};