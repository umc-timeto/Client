/**
 * TaskTime 유틸
 * ------------------------------------------------------------
 * 역할:
 * - 서버에서 내려오는 시간/날짜 관련 값(duration, startAt)을
 *   UI에서 바로 쓰기 좋은 형태(분, 표시 문자열)로 변환하는 유틸 모음
 *
 * 포함 기능:
 * 1) parseApiDurationToMinutes:
 *    - 서버 duration 문자열("1H 30M" 같은 형태) → 숫자 분(minutes)으로 변환
 *
 * 2) formatDuration:
 *    - 분(minutes) → UI 표시용 문자열("1H 30M", "45M" 등)로 변환
 *
 * 3) formatMMDD / formatHHMM / formatMMDD_DOW:
 *    - Date 또는 ISO 문자열을 "MM/DD", "HH:MM", "MM/DD (요일)" 형태로 포맷
 *
 * 4) buildModalDateTimeTexts:
 *    - startAt(ISO) + duration(문자열)을 받아서
 *      모달 상단 표시용 { dateText, timeText }를 생성
 *    - startAt이 없거나 파싱 실패 시 기본값("--/--", "00:00-00:00") 반환
 *
 * 사용 예시(간단):
 * const dto = await taskApi.getTodo(todoId);
 * const { dateText, timeText } = buildModalDateTimeTexts({ startAt: dto.startAt, duration: dto.duration });
 * setModalDateText(dateText);
 * setModalTimeText(timeText);
 * 
  //실데이터 예시
  //parseApiDurationToMinutes("1H 30M") => 90
  //formatDuration(90) => "1H 30M"
  //
  //buildModalDateTimeTexts({
  //  startAt: "2026-02-20T10:00:00.000Z",
  //  duration: "1H 30M"
  //})
  //=> {
  //  dateText: "02/20",
  //  timeText: "10:00 - 11:30"
  //}
 */


//STEP1 duration(H/M 문자열) -> 분 변환
export function parseApiDurationToMinutes(v: string | null | undefined): number {
  const s = String(v ?? "").trim();
  if (!s) return 0;

  const hMatch = s.match(/(\d+)\s*H/i);
  const mMatch = s.match(/(\d+)\s*M/i);

  const h = hMatch ? Number(hMatch[1]) : 0;
  const m = mMatch ? Number(mMatch[1]) : 0;

  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, h * 60 + m);
}

//STEP2 분 -> "1H 30M" 포맷
export function formatDuration(minutes: number) {
  const m = Math.max(0, minutes ?? 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}H ${mm}M`;
  if (h > 0) return `${h}H`;
  return `${mm}M`;
}

//STEP3 날짜/시간 포맷 유틸
const WEEK_KOR = ["일", "월", "화", "수", "목", "금", "토"] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatMMDD(d: Date) {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

export function formatHHMM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

//STEP4 startAt ISO -> "01/31 (토)" 포맷
export function formatMMDD_DOW(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${formatMMDD(d)} (${WEEK_KOR[d.getDay()]})`;
}

//STEP5 모달 상단 날짜/시간 문구 생성
export function buildModalDateTimeTexts(params: { startAt?: string | null; duration?: string | null }) {
  const startAt = params.startAt ?? null;
  const duration = params.duration ?? null;

  if (!startAt) {
    return { dateText: "--/--", timeText: "00:00-00:00" };
  }

  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return { dateText: "--/--", timeText: "00:00-00:00" };
  }

  const minutes = parseApiDurationToMinutes(duration);
  const end = new Date(start.getTime() + minutes * 60 * 1000);

  return {
    dateText: formatMMDD(start),
    timeText: `${formatHHMM(start)} - ${formatHHMM(end)}`,
  };
}
