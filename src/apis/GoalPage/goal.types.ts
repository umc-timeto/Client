//========================
//STEP1 DTO(서버에서 내려오는 goal 형태)
//========================
export type GoalDto = {
  id: number;
  name: string;
  color: string;
};

//========================
//STEP2 요청 바디
//========================
export type AddGoalRequest = {
  name: string;
  color: string;
};

export type UpdateGoalRequest = {
  name: string;
  color: string;
};

//========================
//STEP3 공통 응답 포맷(실제 서버 응답 기준)
//- 너가 보낸 예시:
//  { status, code, message, data: [...] }
//========================
export type ApiResponse<T> = {
  status: number; // 200, 201 ...
  code: string;
  message: string;
  data: T;
};

//목표 추가 응답: data = GoalDto
export type AddGoalResponse = ApiResponse<GoalDto>;

//목표 리스트 응답: data = GoalDto[]
export type GoalListResponse = ApiResponse<GoalDto[]>;

//목표 수정 응답: data = GoalDto (혹은 서버가 null 줄 수도 있어서 안전하게 nullable)
export type UpdateGoalResponse = ApiResponse<GoalDto | null>;

//목표 삭제 응답: data = null
export type DeleteGoalResponse = ApiResponse<null>;
