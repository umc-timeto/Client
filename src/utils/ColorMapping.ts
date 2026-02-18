import type { ColorKey } from "@/constants/timeBlockCreateStore";

export const colorHexToKey = (hex: unknown): ColorKey => {
  let v = String(hex ?? "").trim().toUpperCase();

  if (v && !v.startsWith("#")) {
    v = `#${v}`;
  }

  const map: Record<string, ColorKey> = {
    "#FF8373": "red",
    "#F6AE14": "orange",
    "#FFE240": "yellow",
    "#D5F05F": "lightGreen",
    "#75C7AD": "green",
    "#8AE6EE": "cyan",
    "#6FB7FF": "skyBlue",
    "#638FFF": "blue",
    "#C58BFF": "purple",
    "#FF9FD4": "pink",
  };

  return map[v] ?? "green";
};
/**
 * 서버/저장소에서 오는 goal.color(hex)를
 * 우리 프로젝트의 ColorKey로 매핑한다.
 *
 * 정책:
 * - 매핑 실패 시 "green"으로 고정
 */

/**
 * goal.color(hex) -> 폴더 컬러 normal 토큰 var
 * (UI에서 아이콘/텍스트 컬러로 사용)
 *
 * - 매핑 실패 시 hex 그대로 반환(그래도 색은 찍히게)
 * - 디자인 토큰이 정확히 있으면 var를 쓰는 게 정석
 */
export function getFolderNormalVar(hex: string) {
  const key = colorHexToKey(hex);
  //주의: 기존 코드가 "nomal" 오타를 쓰고 있으면 그대로 맞춰야 UI 안 깨짐
  return `var(--color-folder-${key}-nomal)`;
}

/**
 * goal.color(hex) -> 폴더 컬러 light bg 토큰 var
 * (UI에서 배경색으로 사용)
 *
 * - 매핑 실패 시에도 green 토큰으로 고정 (팀 정책)
 */
export function getFolderLightVar(hex: string) {
  const key = colorHexToKey(hex);
  return `var(--color-folder-${key}-light-bg)`;
}
