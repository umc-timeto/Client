
/**
 * folderApi 사용 예시
 *
 * import { folderApi } from "@/apis/FolderPage/folder";
 *
 * async function fetchFolders(goalId: number) {
 *   try {
 *     const folders = await folderApi.getFolderList(goalId);
 *     console.log("폴더 리스트:", folders);
 *   } catch (error) {
 *     console.error("폴더 리스트 조회 실패:", error);
 *   }
 * }
 *
 * - getFolderList(goalId)는 특정 goalId에 속한 폴더 리스트를 조회합니다.
 * - goalId는 필수(number)입니다.
 * - 성공 시 GoalFolder[] 배열을 반환합니다.
 * - status가 200이 아니면 Error를 throw 합니다.
 */

import { api } from "@/apis/api";

export type GoalFolder = {
  id: number;
  name: string;
  ingTodoCount: number;
};

export type FolderListResponse = {
  status: number;
  code: string;
  message: string;
  data: GoalFolder[];
};

export const folderApi = {
  getFolderList: async (goalId: number) => {
    const res = await api.get<FolderListResponse>("/api/goal/folder/list", {
      params: { goalId },
    });

    return res.data.data;
  },
};