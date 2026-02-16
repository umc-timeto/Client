import { useNavigate } from "react-router-dom";
import type { ColorKey } from "@/constants/timeBlockCreateStore";
import { mockGoals } from "@/pages/TimeBlockPage/data/mockTimeBlockCreate";
import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";
import SelectRow from "@/pages/TimeBlockPage/components/TimeBlockCreate/SelectRow";
import FlagSvg from "@/assets/flag.svg?react";
import NextSvg from "@/assets/next.svg?react";

const colorVar = (key: ColorKey, tone: "nomal" | "light") => `var(--color-folder-${key}-${tone})`;

export default function TimeBlockCreateGoalPage() {
  const navigate = useNavigate();
  const pickedGoal = useTimeBlockCreateStore((s) => s.pickedGoal);
  const setGoal = useTimeBlockCreateStore((s) => s.setGoal);

  return (
    <div className="bg-white px-5">
      <div className="py-10 text-[24px] font-semibold text-grey-darker sticky top-27.5 bg-white">타임 블록으로 불러올<br/> 할 일을 선택해주세요</div>
      <div className="space-y-1">
        {mockGoals.map((g) => (
          <SelectRow
            key={g.id}
            title={g.title}
            selected={pickedGoal?.id === g.id}
            onClick={() => {
              setGoal(g);
              navigate("/timeblock/create/folder");
            }}
            left={
                <div className="p-1.25 mr-1.25">
                    <FlagSvg
                    className="h-4 w-4"
                    style={{ color: colorVar((g.colorKey ?? "yellow") as ColorKey, "nomal") }}/>
                </div>
                }
            right={
              <div className="flex items-center">
                <NextSvg className="w-7 h-7"/>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}