//======================================
//Folder API (mock/localStorage version)
//- 지금: localStorage
//- 나중: axios로 내부 구현만 교체
//======================================

export type FolderItem = {
  id: string;       //UI에서 쓰는 id(문자열로 통일)
  goalId: string;   //UI에서 쓰는 goalId(문자열로 통일)
  name: string;
  todoCount: number;
  order: number;    //목표 내 순서 (1부터)
};

//------------------------------
//백엔드 응답 형태(참고용 타입)
//------------------------------
export type ApiFolder = {
  folderId: number;
  name: string;
  todoCount: number;
};

export type ApiGoalWithFolders = {
  goalId: number;
  name: string;
  color: string;
  folders: ApiFolder[];
};

export type ApiGoalFolderListResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    goals: ApiGoalWithFolders[];
  };
};

//------------------------------
//localStorage store
//------------------------------
const STORAGE_KEY = "timeto_folders";

function loadAll(): FolderItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FolderItem[];
  } catch {
    return [];
  }
}

function saveAll(next: FolderItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function makeId() {
  return `f_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toStrId(v: number | string) {
  return String(v);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

//======================================
//[추가: UI에서 필요한 단건 조회/수정] (edit 프리필/저장용)
//- TaskPage가 getTaskById/updateTask 쓰는 것처럼, 폴더도 동일 패턴 제공
//======================================
export async function getFolderByIdStr(folderId: string): Promise<FolderItem | null> {
  const all = loadAll();
  return all.find((f) => f.id === folderId) ?? null;
}

export async function updateFolderByIdStr(
  folderId: string,
  patch: Partial<Pick<FolderItem, "name">>
): Promise<FolderItem | null> {
  const all = loadAll();
  const idx = all.findIndex((f) => f.id === folderId);
  if (idx < 0) return null;

  const cur = all[idx];
  const updated: FolderItem = { ...cur, ...patch, id: cur.id, goalId: cur.goalId };

  all[idx] = updated;
  saveAll(all);

  await new Promise((r) => setTimeout(r, 120));
  return updated;
}

//======================================
//[API 스펙 맞춘 함수들] (나중에 axios로 교체될 자리)
//======================================

//1) 목표별 폴더 리스트 GET /api/goal/folder/list
//- 실제 백엔드는 goal+folders를 한번에 내려줌
//- 현재는 localStorage로 goals는 모르니까 "goalId별로 묶어서" 비슷하게 만들어줌
export async function fetchGoalFolderList(): Promise<ApiGoalFolderListResponse> {
  const all = loadAll();

  //goalId별로 묶기
  const byGoal = new Map<string, FolderItem[]>();
  for (const f of all) {
    const list = byGoal.get(f.goalId) ?? [];
    list.push(f);
    byGoal.set(f.goalId, list);
  }

  //order로 정렬 + ApiFolder로 변환
  const goals: ApiGoalWithFolders[] = Array.from(byGoal.entries()).map(([goalIdStr, folders]) => {
    const sorted = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return {
      goalId: Number(goalIdStr) || 0,        //현재 goalId가 문자열이라 0될 수도 있음(목업 한계)
      name: "",                               //goal name/color는 홈 mock.ts가 관리중이라 여기선 빈값
      color: "#FFFFFF",
      folders: sorted.map((x) => ({
        folderId: Number(x.id) || 0,         //id가 f_... 형태라 number 변환 불가(목업 한계)
        name: x.name,
        todoCount: x.todoCount ?? 0,
      })),
    };
  });

  return {
    isSuccess: true,
    code: "COMMON200",
    message: "요청에 성공하였습니다.",
    result: { goals },
  };
}

//2) 폴더 추가 POST /api/folder
export async function apiCreateFolder(input: { goalId: number; name: string }) {
  //현재는 localStorage에 저장
  const goalId = toStrId(input.goalId);

  const all = loadAll();
  const inGoal = all.filter((f) => f.goalId === goalId);
  const maxOrder = inGoal.reduce((m, f) => Math.max(m, f.order ?? 0), 0);

  const next: FolderItem = {
    id: makeId(),
    goalId,
    name: input.name,
    todoCount: 0,
    order: maxOrder + 1,
  };

  saveAll([...all, next]);

  //백엔드 응답 형태 맞추기
  return {
    isSuccess: true,
    code: "COMMON200",
    message: "폴더가 생성되었습니다.",
    result: {
      folderId: -1, //목업이라 실제 number id 없음
      createdAt: new Date().toISOString(),
    },
  };
}

//3) 폴더 수정 PATCH /api/folder/{folderId}
//- 서버 붙기 전: number가 아니라 string id(f_...)로도 들어올 수 있어서 둘 다 대응
export async function apiUpdateFolder(folderId: number | string, input: { name: string }) {
  const all = loadAll();
  const folderIdStr = toStrId(folderId);

  const idx = all.findIndex((f) => f.id === folderIdStr);
  if (idx < 0) {
    return {
      isSuccess: false,
      code: "COMMON404",
      message: "폴더를 찾을 수 없습니다.",
      result: null,
    };
  }

  const cur = all[idx];
  all[idx] = { ...cur, name: input.name };
  saveAll(all);

  return {
    isSuccess: true,
    code: "COMMON200",
    message: "폴더 이름이 변경되었습니다.",
    result: {
      folderId: typeof folderId === "number" ? folderId : -1,
      name: input.name,
      updatedAt: new Date().toISOString(),
    },
  };
}

//4) 폴더 삭제 DELETE /api/folder/{folderId}
export async function apiDeleteFolder(folderId: number | string) {
  const all = loadAll();
  const folderIdStr = toStrId(folderId);

  const next = all.filter((f) => f.id !== folderIdStr);
  saveAll(next);

  return {
    isSuccess: true,
    code: "COMMON200",
    message: "폴더가 삭제되었습니다.",
    result: "성공",
  };
}

//5) 폴더 이동 PATCH /api/folder/{folderId}/move  { newIndex }
export async function apiMoveFolder(folderId: number | string, input: { newIndex: number }) {
  //백엔드 newIndex는 0/1 기반이 불확실한데, 너 예시가 "newIndex: 2"라서
  //여기선 "1 기반"으로 처리(= order = newIndex). 서버 붙을 때 확정해서 바꾸면 됨.
  const all = loadAll();
  const folderIdStr = toStrId(folderId);

  const target = all.find((f) => f.id === folderIdStr);
  if (!target) {
    return { status: 404, code: "COMMON404", message: "not found", data: {} };
  }

  const goalId = target.goalId;
  const inGoal = all
    .filter((f) => f.goalId === goalId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const fromIdx = inGoal.findIndex((f) => f.id === folderIdStr);
  if (fromIdx < 0) return { status: 200, code: "COMMON200", message: "ok", data: {} };

  const toIdx = clamp((input.newIndex ?? 1) - 1, 0, inGoal.length - 1);

  const nextInGoal = [...inGoal];
  const [picked] = nextInGoal.splice(fromIdx, 1);
  nextInGoal.splice(toIdx, 0, picked);

  //order 재부여
  const idToOrder = new Map<string, number>();
  nextInGoal.forEach((f, i) => idToOrder.set(f.id, i + 1));

  const nextAll = all.map((f) => {
    if (f.goalId !== goalId) return f;
    const o = idToOrder.get(f.id);
    if (!o) return f;
    return { ...f, order: o };
  });

  saveAll(nextAll);

  return { status: 200, code: "COMMON200", message: "요청에 성공하였습니다.", data: {} };
}

//======================================
//[현재 프론트에서 쓰는 함수들] (호환 유지)
//======================================

export function getFoldersByGoal(goalId: string): FolderItem[] {
  return loadAll()
    .filter((f) => f.goalId === goalId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function createFolder(goalId: string, name: string): FolderItem {
  const all = loadAll();
  const inGoal = all.filter((f) => f.goalId === goalId);
  const maxOrder = inGoal.reduce((m, f) => Math.max(m, f.order ?? 0), 0);

  const next: FolderItem = {
    id: makeId(),
    goalId,
    name,
    todoCount: 0,
    order: maxOrder + 1,
  };

  saveAll([...all, next]);
  return next;
}

export function deleteFoldersByGoal(goalId: string) {
  const all = loadAll();
  saveAll(all.filter((f) => f.goalId !== goalId));
}

export function bumpTodoCount(folderId: string, delta: number) {
  const all = loadAll();
  const idx = all.findIndex((f) => f.id === folderId);
  if (idx < 0) return;

  const cur = all[idx];
  const nextCount = Math.max(0, (cur.todoCount ?? 0) + delta);
  all[idx] = { ...cur, todoCount: nextCount };
  saveAll(all);
}

export function setFolderTodoCount(folderId: string, nextCount: number) {
  const all = loadAll();
  const idx = all.findIndex((f) => f.id === folderId);
  if (idx < 0) return;

  all[idx] = { ...all[idx], todoCount: Math.max(0, nextCount) };
  saveAll(all);
}

export function setFolderOrders(goalId: string, orderedIds: string[]) {
  const all = loadAll();

  const idToOrder = new Map<string, number>();
  orderedIds.forEach((id, i) => idToOrder.set(id, i + 1));

  const next = all.map((f) => {
    if (f.goalId !== goalId) return f;
    const nextOrder = idToOrder.get(f.id);
    if (!nextOrder) return f;
    return { ...f, order: nextOrder };
  });

  saveAll(next);
}
