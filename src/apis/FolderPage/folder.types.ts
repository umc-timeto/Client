// C:\Users\tndus\Client\src\apis\Folder\folder.types.ts

//========================
// 서버 DTO
//========================
export type FolderDto = {
  id: number;
  name: string;
  ingTodoCount: number;
};

//========================
// 요청 바디
//========================
export type AddFolderRequest = {
  folderName: string;
};

export type UpdateFolderRequest = {
  folderName: string;
};

//========================
// 공통 응답(스웨거 기준)
// - status/code/message/data
//========================
export type CommonResponse<T> = {
  status: number;
  code: string;
  message: string;
  data: T;
};

//========================
// 응답 타입
//========================
export type FolderListResponse = CommonResponse<FolderDto[]>;

export type AddFolderResponse = CommonResponse<{
  id: number;
  name: string;
}>;

export type UpdateFolderResponse = CommonResponse<{
  id: number;
  name: string;
}>;

export type DeleteFolderResponse = CommonResponse<Record<string, never> | {}>;

export type MoveFolderResponse = CommonResponse<Record<string, never> | {}>;
