import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderActions } from "@/contexts/HeaderActionContext";

import UnderlineBox from "@/components/UnderlineBox";

import FlagSvg from "@/assets/flag.svg?react";
import NextSvg from "@/assets/next.svg?react";

import { loadGoals, getFolderNormalVar, type GoalItem } from "@/pages/HomePage/mock";
import { createFolder, getFolderByIdStr, updateFolderByIdStr } from "@/api/folderApi";

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

  //========================
  //쿼리 파라미터(mode/ids/step)
  //========================
  const mode = searchParams.get("mode") ?? "create"; //create | edit
  const folderId = searchParams.get("folderId");
  const isEdit = mode === "edit" && !!folderId;

  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");

  //edit는 무조건 step2
  const safeStep = isEdit ? 2 : step === 2 ? 2 : 1;

  //========================
  //목표 목록/선택
  //========================
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [pickedGoalId, setPickedGoalId] = useState<string | null>(searchParams.get("goalId"));

  const pickedGoal = useMemo(() => {
    if (!pickedGoalId) return null;
    return goals.find((g) => g.id === pickedGoalId) ?? null;
  }, [goals, pickedGoalId]);

  //========================
  //입력 상태
  //========================
  const [folderName, setFolderName] = useState("");
  const [folderFocused, setFolderFocused] = useState(false);

  const folderActive = folderName.trim().length > 0;

  //edit: 목표 선택 없어도 저장 가능
  const canSave = isEdit
    ? isValidFolderName(folderName)
    : !!pickedGoal && isValidFolderName(folderName);

  //========================
  //초기 로드
  //========================
  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  //========================
  //edit 모드 프리필 (단 1회)
  //========================
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;

    //create는 프리필 필요 없음
    if (!isEdit) {
      setPrefilled(true);
      return;
    }

    (async () => {
      const f = await getFolderByIdStr(folderId!);
      if (!f) {
        //잘못된 id면 홈으로
        navigate("/home", { replace: true });
        return;
      }

      //기존 값 프리필
      setFolderName(f.name ?? "");
      setPickedGoalId(f.goalId ?? null);

      //edit는 step2가 맞으니까 쿼리도 강제 정리(헤더/뒤로가기 꼬임 방지)
      const next = new URLSearchParams(searchParams);
      next.set("mode", "edit");
      next.set("step", "2");
      next.set("folderId", String(folderId));
      if (f.goalId) next.set("goalId", String(f.goalId));
      next.set("canSave", "0"); //프리필 후 아래 useEffect가 다시 덮어씀
      setSearchParams(next, { replace: true });

      setPrefilled(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilled, isEdit, folderId, navigate]);

  //========================
  //헤더가 읽는 canSave 쿼리 반영
  //========================
  useEffect(() => {
    //프리필 전에는 깜빡임 방지
    if (!prefilled) return;

    const next = new URLSearchParams(searchParams);
    next.set("canSave", canSave ? "1" : "0");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilled, canSave]);

  //========================
  //저장 동작(create/edit 분기)
  //========================
  const handleSave = useCallback(async () => {
    if (!prefilled) return;
    if (!canSave) return;

    //edit
    if (isEdit && folderId) {
      const nextName = folderName.trim();
      await updateFolderByIdStr(folderId, { name: nextName });

      //중요: -1로 돌아가면 folderName 쿼리가 옛날값이라 화면에서 안 바뀔 수 있음
      //=> 폴더 페이지로 최신 이름을 들고 이동
      navigate(
        `/folder?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(nextName)}`,
        { replace: true, state: { folderId, folderName: nextName } }
      );
      return;
    }

    //create
    if (!pickedGoal) return;
    createFolder(pickedGoal.id, folderName.trim());

    //저장 후 홈으로
    navigate("/home");
  }, [prefilled, canSave, isEdit, folderId, folderName, pickedGoal, navigate]);

  //헤더 저장 버튼 연결(AppHeaderAuto에서 complete 호출)
  useEffect(() => {
    setOnComplete(() => handleSave);
    return () => setOnComplete(null);
  }, [setOnComplete, handleSave]);

  //========================
  //STEP 이동 유틸 (create에서만 사용)
  //========================
  const goStep2 = (goalId: string) => {
    setPickedGoalId(goalId);

    const next = new URLSearchParams(searchParams);
    next.set("mode", "create");
    next.set("step", "2");
    next.set("goalId", goalId);
    next.set("canSave", "0");
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
        {isEdit ? (
          <>
            폴더 이름을
            <br />
            수정해주세요
          </>
        ) : (
          <>
            목표를 세분화하는
            <br />
            폴더를 만들어주세요
          </>
        )}
      </h1>

      {!isEdit ? (
        <p className="mt-2 text-[14px] font-medium leading-normal text-green-normal">
          목표를 작게 나눌수록 달성하기 쉬워요
        </p>
      ) : null}

      {/*선택된 목표 표시 (edit에서도 보여주되, 목표가 로드되기 전엔 안 뜰 수 있음)*/}
      {pickedGoal ? (
        <div className="mt-6 flex items-center gap-2">
          <FlagSvg className="h-4 w-4" style={{ color: getFolderNormalVar(pickedGoal.color) }} />
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
