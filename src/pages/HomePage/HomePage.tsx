//C:\Users\tndus\Client\src\pages\HomePage\HomePage.tsx
import { useEffect, useState } from "react";
import { loadGoals, type GoalItem } from "./mock";

export default function HomePage() {
  //STEP1 목표 목록 상태
  const [goals, setGoals] = useState<GoalItem[]>([]);

  //STEP2 로컬 mock 데이터 로드
  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  return (
    <div className="px-5 pt-6">
      {/*목표 리스트 영역*/}
      <div className="flex flex-col gap-3">
        {goals.length === 0 ? (
          <div className="body-14-regular text-gray-300">아직 목표가 없습니다</div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-4"
            >
              {/*목표 색상 표시*/}
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: g.color }} />
                <div className="body-16-medium text-gray-700">{g.name}</div>
              </div>

              {/*우측 정보 영역:추후 task 합계/폴더 개수 등 연결*/}
              <div className="body-14-regular text-gray-300">-</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
