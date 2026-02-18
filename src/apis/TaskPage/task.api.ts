import { api } from "@/apis/api";
import type {
  ApiResponse,
  AddTodoRequest,
  AddTodoResponseData,
  TodoDetailDto,
  UpdateTodoRequest,
  UpdateTodoResponseData,
  DeleteTodoResponseData,
  UpdateTodoStatusRequest,
  UpdateTodoStatusResponseData,
  UnblockedTodoListResponseData,
  TodoListResponseData,
  UpdateTodoOrderRequest, 
  UpdateTodoOrderResponseData
} from "./task.types";

//======================================
//Task(Todo) API
//- Swagger 명세 기준
//- baseURL / 토큰 처리: api 인스턴스에서 처리
//- "성공인데 catch로 떨어지는" 케이스(201 등) 방지:
//  => 각 API 함수에서 2xx를 성공으로 판정
//======================================

//========================
//STEP1 상태코드 성공 판정 유틸
//========================
function isOk(status: number) {
  return status >= 200 && status < 300;
}

//========================
//STEP2 응답 언랩 (ApiResponse<T> -> T)
//========================
function unwrap<T>(resBody: ApiResponse<T>): T {
  return resBody.data;
}

//========================
//STEP3 axios 에러에서 응답 바디 꺼내기
//- api.ts 인터셉터가 throw 하더라도,
//  여기서 "응답이 2xx면" 성공으로 처리할 수 있게 우회
//========================
function getAxiosResponseLike<T>(e: unknown) {
  const anyErr = e as any;
  const status = anyErr?.response?.status as number | undefined;
  const data = anyErr?.response?.data as ApiResponse<T> | undefined;
  return { status, data };
}

export const taskApi = {
  //------------------------------
  //1) 할 일 추가 (POST)
  // /api/todo/{folderId}
  //------------------------------
  async addTodo(folderId: number, body: AddTodoRequest) {
    try {
      const res = await api.post<ApiResponse<AddTodoResponseData>>(`/api/todo/${folderId}`, body);
      if (!isOk(res.status)) throw new Error(`addTodo failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<AddTodoResponseData>(e);

      //✅ "성공인데 catch" 케이스 구제
      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.addTodo] error", e);
      throw e;
    }
  },

  //------------------------------
  //2) 할 일 상세 조회 (GET)
  // /api/todo/{todoId}
  //------------------------------
  async getTodo(todoId: number) {
    try {
      const res = await api.get<ApiResponse<TodoDetailDto>>(`/api/todo/${todoId}`);
      if (!isOk(res.status)) throw new Error(`getTodo failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<TodoDetailDto>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.getTodo] error", e);
      throw e;
    }
  },

  //------------------------------
  //3) 할 일 삭제 (DELETE)
  // /api/todo/{todoId}
  //------------------------------
  async deleteTodo(todoId: number) {
    try {
      const res = await api.delete<ApiResponse<DeleteTodoResponseData>>(`/api/todo/${todoId}`);
      if (!isOk(res.status)) throw new Error(`deleteTodo failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<DeleteTodoResponseData>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.deleteTodo] error", e);
      throw e;
    }
  },

  //------------------------------
  //4) 할 일 수정 (PATCH)
  // /api/todo/{todoId}
  //------------------------------
  async updateTodo(todoId: number, body: UpdateTodoRequest) {
    try {
      const res = await api.patch<ApiResponse<UpdateTodoResponseData>>(`/api/todo/${todoId}`, body);
      if (!isOk(res.status)) throw new Error(`updateTodo failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<UpdateTodoResponseData>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.updateTodo] error", e);
      throw e;
    }
  },

  //------------------------------
  //5) 할 일 상태 변경 (PATCH)
  // /api/todo/status/{todoId}
  //------------------------------
  async updateTodoStatus(todoId: number, body: UpdateTodoStatusRequest) {
    try {
      const res = await api.patch<ApiResponse<UpdateTodoStatusResponseData>>(
        `/api/todo/status/${todoId}`,
        body
      );
      if (!isOk(res.status)) throw new Error(`updateTodoStatus failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<UpdateTodoStatusResponseData>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.updateTodoStatus] error", e);
      throw e;
    }
  },

  //------------------------------
  //6) 블록 생성 후보(미블록) 할 일 조회 (GET)
  // /api/todo/{folderId}/todo/unblocked
  //------------------------------
  async getUnblockedTodos(folderId: number) {
    try {
      const res = await api.get<ApiResponse<UnblockedTodoListResponseData>>(
        `/api/todo/${folderId}/todo/unblocked`
      );
      if (!isOk(res.status)) throw new Error(`getUnblockedTodos failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<UnblockedTodoListResponseData>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.getUnblockedTodos] error", e);
      throw e;
    }
  },

  //------------------------------
  //7) 진행 중인 할 일 리스트 (GET)
  // /api/todo/{folderId}/todo/progress
  //------------------------------
  async getProgressTodos(folderId: number) {
    try {
      const res = await api.get<ApiResponse<TodoListResponseData>>(`/api/todo/${folderId}/todo/progress`);
      if (!isOk(res.status)) throw new Error(`getProgressTodos failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<TodoListResponseData>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.getProgressTodos] error", e);
      throw e;
    }
  },

  //------------------------------
  //8) 완료된 할 일 리스트 (GET)
  // /api/todo/{folderId}/todo/complete
  //------------------------------
  async getCompleteTodos(folderId: number) {
    try {
      const res = await api.get<ApiResponse<TodoListResponseData>>(`/api/todo/${folderId}/todo/complete`);
      if (!isOk(res.status)) throw new Error(`getCompleteTodos failed: ${res.status}`);
      return unwrap(res.data);
    } catch (e) {
      const { status, data } = getAxiosResponseLike<TodoListResponseData>(e);

      if (status !== undefined && isOk(status) && data) {
        return unwrap(data);
      }

      console.error("[taskApi.getCompleteTodos] error", e);
      throw e;
    }
  },

  //할일 순서 변경 메서드
  async updateTodoOrder(todoId: number, body: UpdateTodoOrderRequest) {
  const res = await api.patch<ApiResponse<UpdateTodoOrderResponseData>>(
    `/api/todo/order/${todoId}`,
    body
  );
  return unwrap(res.data);
},
};
