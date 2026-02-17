import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { folderApi } from "@/apis/FolderPage/folder";
import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";
import SelectRow from "@/pages/TimeBlockPage/components/TimeBlockCreate/SelectRow";
import NextSvg from "@/assets/next-dark.svg?react";

export default function TimeBlockCreateFolderPage() {
  const navigate = useNavigate();
  const pickedGoal = useTimeBlockCreateStore((s) => s.pickedGoal);
  const pickedFolder = useTimeBlockCreateStore((s) => s.pickedFolder);
  const setFolder = useTimeBlockCreateStore((s) => s.setFolder);

  if (!pickedGoal) {
    return <Navigate to="/timeblock/create/goal" replace />;
  }

  const goalId = Number(pickedGoal.id);

  const {
    data: folders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["folders", "list", goalId],
    queryFn: () => folderApi.getFolderList(goalId),
    enabled: Number.isFinite(goalId) && goalId > 0,
  });

  return (
    <div className="bg-white px-5">
      <div className="py-10 text-[24px] font-semibold text-grey-darker sticky top-27.5 bg-white">타임 블록으로 불러올<br/> 할 일을 선택해주세요</div>
      {isLoading && <div className="py-4 text-[12px] text-grey-darker/60">불러오는 중...</div>}
      {isError && <div className="py-4 text-[12px] text-red-500">폴더 리스트를 불러오지 못했습니다.</div>}

      {!isLoading && !isError && (
        <div className="mt-4 space-y-2">
          {folders.map((f: any) => (
            <SelectRow
              key={f.id}
              title={f.name}
              selected={Number(pickedFolder?.id) === Number(f?.id)}
              onClick={() => {
                setFolder({
                  id: f.id,
                  name: f.name,
                  ingTodoCount: f.ingTodoCount,
                } as any);
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
      )}
    </div>
  );
}