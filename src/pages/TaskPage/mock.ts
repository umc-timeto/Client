import type { Task } from "@/types/task";

// 폴더 id는 아직 FolderPage 구현 전이니까, 임시로 고정 값으로 두는 게 편함
export const MOCK_FOLDER_ID = "f1";

export const mockTasks: Task[] = [
  {
    id: "t1",
    folderId: MOCK_FOLDER_ID,
    title: "1.3 속성",
    durationMinutes: 90,
    priority: "상",
    isDone: false,
  },
  {
    id: "t2",
    folderId: MOCK_FOLDER_ID,
    title: "1.4 관계",
    durationMinutes: 80,
    priority: "상",
    isDone: false,
  },
  {
    id: "t3",
    folderId: MOCK_FOLDER_ID,
    title: "1.5 식별자",
    durationMinutes: 120,
    priority: "중",
    isDone: false,
  },
  {
    id: "t4",
    folderId: MOCK_FOLDER_ID,
    title: "1.1 데이터 모델의 이해",
    durationMinutes: 60,
    priority: "상",
    isDone: true,
  },
];