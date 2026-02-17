import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderActions } from "@/contexts/HeaderActionContext";

import UnderlineBox from "@/components/UnderlineBox";

import FlagSvg from "@/assets/flag.svg?react";
import NextSvg from "@/assets/next.svg?react";

import { loadGoals, getFolderNormalVar, type GoalItem } from "@/pages/HomePage/mock";
import { createFolder } from "@/api/folderApi";

const ACCENT_BLACK = "var(--color-black)";

function isValidFolderName(v: string) {
  if (v.length > 20) return false;
  if (v.trim().length === 0) return false;
  return true;
}

export default function FolderSelectPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setOnComplete } = useHeaderActions();

  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = step === 2 ? 2 : 1;

  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [pickedGoalId, setPickedGoalId] = useState<string | null>(searchParams.get("goalId"));

  const pickedGoal = useMemo(() => {
    if (!pickedGoalId) return null;
    return goals.find((g) => g.id === pickedGoalId) ?? null;
  }, [goals, pickedGoalId]);

  const [folderName, setFolderName] = useState("");
  const [folderFocused, setFolderFocused] = useState(false);

  const folderActive = folderName.trim().length > 0;
  const canSave = !!pickedGoal && isValidFolderName(folderName);

  //초기 로드
  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  //헤더가 읽는 canSave 쿼리 반영(저장 활성)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (canSave) next.set("canSave", "1");
    else next.set("canSave", "0");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  //저장 동작
  const handleSave = useCallback(() => {
    if (!pickedGoal) return;
    if (!canSave) return;

    createFolder(pickedGoal.id, folderName.trim());

    //저장 후 홈으로(원하면 navigate(-1)로 바꿔도 됨)
    navigate("/home");
  }, [pickedGoal, canSave, folderName, navigate]);

  //헤더 저장 버튼 연결(AppHeaderAuto에서 complete 호출)
  useEffect(() => {
    setOnComplete(() => handleSave);
    return () => setOnComplete(null);
  }, [setOnComplete, handleSave]);

  //STEP 이동 유틸
  const goStep2 = (goalId: string) => {
    setPickedGoalId(goalId);

    const next = new URLSearchParams(searchParams);
    next.set("step", "2");
    next.set("goalId", goalId);
    setSearchParams(next, { replace: true });
  };

  //========================
  //STEP1: 목표 선택 화면
  //========================
  if (safeStep === 1) {
    return (
      <div className="bg-white px-5 pt-8">
        <h1 className="text-[24px] font-semibold leading-[140%] text-black">
          폴더를 추가할
          <br />
          목표를 선택해주세요
        </h1>

        <div className="mt-8 flex flex-col">
          {goals.map((g) => {
            const flagColor = getFolderNormalVar(g.color);

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => goStep2(g.id)}
                className="flex h-13.5 w-full items-center justify-between py-3.25 pr-2.5"
              >
                <div className="flex items-center gap-3">
                  <FlagSvg className="h-4 w-4" style={{ color: flagColor }} />
                  <div className="h-7 flex items-center text-[16px] font-semibold text-gray-700">
                    {g.title}
                  </div>
                </div>

                <NextSvg className="h-7 w-7" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  //========================
  //STEP2: 폴더 입력 화면
  //========================
  return (
    <div className="bg-white px-5 pt-8">
      <h1 className="text-[24px] font-semibold leading-[140%] text-black">
        목표를 세분화하는
        <br />
        폴더를 만들어주세요
      </h1>

      <p className="mt-2 text-[14px] font-medium leading-normal text-green-normal">
        목표를 작게 나눌수록 달성하기 쉬워요
      </p>

      {/*선택된 목표 표시*/}
      {pickedGoal ? (
        <div className="mt-6 flex items-center gap-2">
          <FlagSvg
            className="h-4 w-4"
            style={{ color: getFolderNormalVar(pickedGoal.color) }}
          />
          <div className="text-[12px] font-semibold text-grey-normal">{pickedGoal.title}</div>
        </div>
      ) : null}

      {/*폴더 이름 입력*/}
      <div className="mt-8">
        <UnderlineBox
          label="폴더 이름"
          mode="input"
          active={folderActive}
          focused={folderFocused && !folderActive}
          accentColor={ACCENT_BLACK}
          inputValue={folderName}
          onInputChange={(v) => setFolderName(v.slice(0, 20))}
          onInputFocus={() => setFolderFocused(true)}
          onInputBlur={() => setFolderFocused(false)}
        />
      </div>
    </div>
  );
}
