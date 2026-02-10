export type TaskPriority = "상" | "중" | "하";

export type Task = {
  id: string;               // task 고유 id
  folderId: string;         // 어떤 폴더에 속한 task인지
  title: string;            // 할 일 이름
  durationMinutes: number;  // 소요 시간 (분 단위)
  priority: TaskPriority;   // 중요도
  isDone: boolean;          // 진행/완료
};

export type TaskCreateInput = {
  folderId: string;
  title: string;
  durationMinutes: number;
  priority: TaskPriority;
};