import type { ColorKey } from "@/constants/timeBlockCreateStore";

export const colorHexToKey = (hex: unknown): ColorKey => {
  const v = String(hex ?? "").trim().toUpperCase();

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