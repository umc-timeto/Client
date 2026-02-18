// C:\Users\tndus\Client\src\apis\FolderPage\folder.api.ts
import { api } from "@/apis/api";
import type {
  AddFolderRequest,
  AddFolderResponse,
  DeleteFolderResponse,
  FolderDto,
  FolderListResponse,
  MoveFolderResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
} from "./folder.types";

//========================
// 공통 성공 판정 (2xx면 성공)
//========================
function assertOk(payload?: { status?: number; message?: string }) {
  const s = payload?.status;
  const ok = typeof s === "number" && s >= 200 && s < 300;
  if (!ok) {
    throw new Error(payload?.message ?? "Request failed");
  }
}

//========================
// 서버 호출만 담당
//========================
export const folderApi = {
  // 목표별 폴더 리스트 조회
  // GET /api/goal/folder/list?goalId=1
  getFoldersByGoal: async (goalId: number): Promise<FolderDto[]> => {
    const res = await api.get<FolderListResponse>("/api/goal/folder/list", {
      params: { goalId },
    });

    const payload = res.data;
    assertOk(payload);

    return payload.data ?? [];
  },

  // 폴더 추가
  // POST /api/folder?goalId=1  body: { folderName }
  // 서버가 201로 줄 수 있음
  addFolder: async (goalId: number, body: AddFolderRequest): Promise<{ id?: number; name?: string } | {}> => {
    const res = await api.post<AddFolderResponse>("/api/folder", body, {
      params: { goalId },
    });

    const payload = res.data;
    assertOk(payload);

    // 서버가 data를 비워서 줄 수도 있으니 안전하게 반환
    return payload.data ?? {};
  },

  // 폴더 이름 수정
  // PATCH /api/folder/{folderId}  body: { folderName }
  updateFolder: async (
    folderId: number,
    body: UpdateFolderRequest
  ): Promise<{ id?: number; name?: string } | {}> => {
    const res = await api.patch<UpdateFolderResponse>(`/api/folder/${folderId}`, body);
    const payload = res.data;

    assertOk(payload);
    return payload.data ?? {};
  },

  // 폴더 삭제
  // DELETE /api/folder/{folderId}
  deleteFolder: async (folderId: number): Promise<void> => {
    const res = await api.delete<DeleteFolderResponse>(`/api/folder/${folderId}`);
    const payload = res.data;

    assertOk(payload);
  },

  // 폴더 이동(드래그&드롭)
  // PATCH /api/folder/{folderId}/move?newIndex=2
  moveFolder: async (folderId: number, newIndex: number): Promise<void> => {
    const res = await api.patch<MoveFolderResponse>(
      `/api/folder/${folderId}/move`,
      {},
      { params: { newIndex } }
    );

    const payload = res.data;
    assertOk(payload);
  },
};
