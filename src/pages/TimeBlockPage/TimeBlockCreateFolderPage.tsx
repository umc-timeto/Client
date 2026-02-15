import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { mockFolders } from "@/pages/TimeBlockPage/data/mockTimeBlockCreate";
import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";
import SelectRow from "@/pages/TimeBlockPage/components/TimeBlockCreate/SelectRow";
import NextSvg from "@/assets/next-dark.svg?react";


export default function TimeBlockCreateFolderPage() {
  const navigate = useNavigate();
  const pickedGoal = useTimeBlockCreateStore((s) => s.pickedGoal);
  const pickedFolder = useTimeBlockCreateStore((s) => s.pickedFolder);
  const setFolder = useTimeBlockCreateStore((s) => s.setFolder);

  const folders = useMemo(() => {
    if (!pickedGoal) return [];
    return mockFolders.filter((f) => f.goalId === pickedGoal.id);
  }, [pickedGoal]);

  if (!pickedGoal) {
    return <Navigate to="/timeblock/create/goal" replace />;
  }

  return (
    <div className="bg-white px-5">
      <div className="py-10 text-[24px] font-semibold text-grey-darker sticky top-27.5 bg-white">타임 블록으로 불러올<br/> 할 일을 선택해주세요</div>

      <div className="mt-4 space-y-2">
        {folders.map((f) => (
          <SelectRow
            key={f.id}
            title={f.title}
            selected={pickedFolder?.id === f.id}
            onClick={() => {
              setFolder(f);
              navigate("/timeblock/create/task");
            }}
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