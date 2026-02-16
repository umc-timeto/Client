import type { FolderItem, GoalItem, TaskItem } from "@/constants/timeBlockCreateStore";

export const mockGoals: GoalItem[] = [
  { id: "g1", title: "SQLD", colorKey: "yellow" },
  { id: "g2", title: "미국 여행", colorKey: "blue" },
  { id: "g3", title: "정보처리기사", colorKey: "green" },
  { id: "g4", title: "4-1기말고사", colorKey: "red" },
  { id: "g5", title: "운동 루틴", colorKey: "lightGreen" },
  { id: "g6", title: "독서 프로젝트", colorKey: "purple" },
  { id: "g7", title: "개인 브랜딩", colorKey: "pink" },
  { id: "g8", title: "사이드 프로젝트", colorKey: "cyan" },
  { id: "g9", title: "토익 준비", colorKey: "skyBlue" },
];

export const mockFolders: FolderItem[] = [
  { id: "f1", title: "1과목 암기", goalId: "g1" },
  { id: "f2", title: "2과목 암기", goalId: "g1" },
  { id: "f3", title: "기출 풀이와 복습", goalId: "g1" },

  { id: "f4", title: "여행 일정 정리", goalId: "g2" },
  { id: "f5", title: "항공권/숙소", goalId: "g2" },

  { id: "f6", title: "필기 대비", goalId: "g3" },
  { id: "f7", title: "실기 대비", goalId: "g3" },

  { id: "f8", title: "수학", goalId: "g4" },
  { id: "f9", title: "전공 과목", goalId: "g4" },

  { id: "f10", title: "주 3회 루틴", goalId: "g5" },
  { id: "f11", title: "식단 관리", goalId: "g5" },

  { id: "f12", title: "읽을 책 목록", goalId: "g6" },
  { id: "f13", title: "독서 기록", goalId: "g6" },

  { id: "f14", title: "브랜딩 전략 정리", goalId: "g7" },
  { id: "f15", title: "SNS 운영 계획", goalId: "g7" },

  { id: "f16", title: "기능 기획", goalId: "g8" },
  { id: "f17", title: "UI 개선", goalId: "g8" },

  { id: "f18", title: "LC 문제 풀이", goalId: "g9" },
  { id: "f19", title: "RC 문제 풀이", goalId: "g9" },
];

export const mockTasks: TaskItem[] = [
  { id: "t1", title: "1과목 핵심 암기", folderId: "f1", minutes: 15, level: "mid", colorKey: "yellow" },
  { id: "t20", title: "2과목 핵심 암기", folderId: "f1", minutes: 35, level: "mid", colorKey: "yellow" },
  { id: "t2", title: "2과목 요약 정리", folderId: "f2", minutes: 40, level: "high", colorKey: "yellow" },
  { id: "t3", title: "기출 1세트 풀이", folderId: "f3", minutes: 60, level: "low", colorKey: "yellow" },

  { id: "t4", title: "여행 일정 1차 작성", folderId: "f4", minutes: 20, level: "mid", colorKey: "blue" },
  { id: "t5", title: "항공권/숙소 최종 확인", folderId: "f5", minutes: 15, level: "high", colorKey: "blue" },

  { id: "t6", title: "필기 이론 복습", folderId: "f6", minutes: 45, level: "mid", colorKey: "green" },
  { id: "t7", title: "실기 문제 1세트", folderId: "f7", minutes: 50, level: "high", colorKey: "green" },

  { id: "t8", title: "수학 문제 10개", folderId: "f8", minutes: 35, level: "high", colorKey: "red" },
  { id: "t9", title: "전공 개념 3개 정리", folderId: "f9", minutes: 30, level: "mid", colorKey: "red" },

  { id: "t10", title: "주 3회 루틴 실행", folderId: "f10", minutes: 60, level: "mid", colorKey: "lightGreen" },
  { id: "t11", title: "식단 기록 작성", folderId: "f11", minutes: 80, level: "low", colorKey: "lightGreen" },

  { id: "t12", title: "읽을 책 10페이지", folderId: "f12", minutes: 80, level: "mid", colorKey: "purple" },
  { id: "t13", title: "독서 기록 정리", folderId: "f13", minutes: 15, level: "low", colorKey: "purple" },

  { id: "t14", title: "브랜딩 전략 문서화", folderId: "f14", minutes: 40, level: "high", colorKey: "pink" },
  { id: "t15", title: "SNS 콘텐츠 초안 작성", folderId: "f15", minutes: 25, level: "mid", colorKey: "pink" },

  { id: "t16", title: "핵심 기능 정의", folderId: "f16", minutes: 50, level: "high", colorKey: "cyan" },
  { id: "t17", title: "UI 디테일 개선", folderId: "f17", minutes: 30, level: "mid", colorKey: "cyan" },

  { id: "t18", title: "LC 1세트 풀이", folderId: "f18", minutes: 35, level: "mid", colorKey: "skyBlue" },
  { id: "t19", title: "RC 1세트 풀이", folderId: "f19", minutes: 40, level: "high", colorKey: "skyBlue" },
];

export type TimeBlockMock = {
  id: string;
  date: string; 
  start: string; 
  taskId: string;
};

export const mockTimeBlocks: TimeBlockMock[] = [
  { id: "tb1", date: "2026-01-24", start: "19:10", taskId: "t1" }, 
  { id: "tb2", date: "2026-01-24", start: "19:35", taskId: "t20" }, 
  { id: "tb3", date: "2026-01-24", start: "20:00", taskId: "t3" },
  { id: "tb6", date: "2026-01-24", start: "19:20", taskId: "t4" },

  { id: "tb4", date: "2026-01-24", start: "06:50", taskId: "t10" },
  { id: "tb5", date: "2026-01-24", start: "07:10", taskId: "t11" },
  { id: "tb7", date: "2026-01-24", start: "10:10", taskId: "t12" },
];

export const findTaskById = (id: string) => mockTasks.find((t) => t.id === id);
export const findFolderById = (id: string) => mockFolders.find((f) => f.id === id);
export const findGoalById = (id: string) => mockGoals.find((g) => g.id === id);