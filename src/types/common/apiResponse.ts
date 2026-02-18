//src/types/common/apiResponse.ts

//(A) status/code/message/data 스타일
export type ApiDataResponse<T> = {
  status: number;
  code?: string;
  message?: string;
  data: T;
};

//(시연/스웨거에서 흔한 변형) isSuccess/code/message/result 스타일
export type ApiResultResponse<T> = {
  isSuccess: boolean;
  code?: string;
  message?: string;
  result: T;
};

//둘 다 받을 수 있게 유니온
export type ApiResponse<T> = ApiDataResponse<T> | ApiResultResponse<T>;

//런타임 판별
export function isDataResponse<T>(v: any): v is ApiDataResponse<T> {
  return v && typeof v === "object" && typeof v.status === "number" && "data" in v;
}

export function isResultResponse<T>(v: any): v is ApiResultResponse<T> {
  return v && typeof v === "object" && typeof v.isSuccess === "boolean" && "result" in v;
}

//에러 메시지 뽑기
export function pickApiMessage(v: any, fallback: string) {
  return typeof v?.message === "string" && v.message.trim().length > 0 ? v.message : fallback;
}
