import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ColorKey } from "@/constants/timeBlockCreateStore";
import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";
import { useQuery } from "@tanstack/react-query";
import { goalApi } from "@/apis/GoalPage/goal";
import SelectRow from "@/pages/TimeBlockPage/components/TimeBlockCreate/SelectRow";
import FlagSvg from "@/assets/flag.svg?react";
import NextSvg from "@/assets/next.svg?react";
import { colorHexToKey } from "@/utils/ColorMapping";

const colorVar = (key: ColorKey, tone: "nomal" | "light") => `var(--color-folder-${key}-${tone})`;

export default function TimeBlockCreateGoalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") ?? sessionStorage.getItem("timetto_timeblock_date");

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("[TimeBlockCreateGoalPage] search:", window.location.search);
    console.log("[TimeBlockCreateGoalPage] dateParam:", dateParam);
  }, [dateParam]);

  const dateQuery = dateParam ? `?date=${encodeURIComponent(dateParam)}` : "";
  const pickedGoal = useTimeBlockCreateStore((s) => s.pickedGoal);
  const setGoal = useTimeBlockCreateStore((s) => s.setGoal);

  const { data: goals = [], isLoading, isError } = useQuery({
    queryKey: ["goals", "list"],
    queryFn: () => goalApi.getGoalList(),
    select: (res: any) => {
      const maybe = res?.data ?? res;
      const list = Array.isArray(maybe) ? maybe : maybe?.data;
      return Array.isArray(list) ? list : [];
    },
  });

  return (
    <div className="bg-white px-5">
      <div className="py-10 text-[24px] font-semibold text-grey-darker sticky top-27.5 bg-white">
        타임 블록으로 불러올<br /> 할 일을 선택해주세요
      </div>

      {isLoading && <div className="py-4 text-[12px] text-grey-darker/60">불러오는 중...</div>}
      {isError && <div className="py-4 text-[12px] text-red-500">목표 리스트를 불러오지 못했습니다.</div>}

      {!isLoading && !isError && (
        <div className="space-y-1">
          {goals.map((g: any) => {
            const goalId = Number(g?.id);
            const title = (g?.name ?? g?.title ?? "").toString();
            const colorKey = (g?.colorKey ?? colorHexToKey(g?.color)) as ColorKey;

            return (
              <SelectRow
                key={String(g?.id ?? goalId)}
                title={title}
                selected={Number(pickedGoal?.id) === goalId}
                onClick={() => {
                  setGoal({
                    ...g,
                    id: goalId,
                    name: title,
                    colorKey,
                  });
                  navigate(`/timeblock/create/folder${dateQuery}`);
                }}
                left={
                  <div className="p-1.25 mr-1.25">
                    <FlagSvg className="h-4 w-4" style={{ color: colorVar(colorKey, "nomal") }} />
                  </div>
                }
                right={
                  <div className="flex items-center">
                    <NextSvg className="w-7 h-7" />
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}