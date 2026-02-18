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
//STEP3 응답 바디(스웨거 캡처 기준)
//========================
export type AddGoalResponse = {
  status: number; //201
  code: string;
  message: string;
  data: GoalDto;
};

export type GoalListSwaggerResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    goals: GoalDto[];
  };
};

export type UpdateGoalResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: GoalDto;
};

export type DeleteGoalResponse = {
  status: number; //200
  code: string;
  message: string;
  data: null;
};
