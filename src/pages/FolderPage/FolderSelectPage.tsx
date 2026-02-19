// C:\Users\tndus\Client\src\pages\FolderPage\FolderSelectPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderActions } from "@/contexts/HeaderActionContext";

import UnderlineBox from "@/components/UnderlineBox";

import FlagSvg from "@/assets/flag.svg?react";
import NextSvg from "@/assets/next.svg?react";

import { getFolderNormalVar } from "@/utils/ColorMapping";

import { goalApi } from "@/apis/GoalPage/goal";
import { folderApi } from "@/apis/FolderPage/folder.api";

const ACCENT_BLACK = "var(--color-black)";

function isValidFolderName(v: string) {
  if (v.length > 20) return false;
  if (v.trim().length === 0) return false;
  return true;
}

//========================
// UI Goal 타입
//========================
type UiGoalItem = {
  id: string;
  title: string;
  color: string;
};

function toUiGoalItem(it: { id: number; name: string; color: string }): UiGoalItem {
  return {
    id: String(it.id),
    title: it.name,
    color: it.color,
  };
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
  const [goals, setGoals] = useState<UiGoalItem[]>([]);
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

  //STEP1 모바일 한글 조합 상태
  const [isComposing, setIsComposing] = useState(false);

  const folderActive = folderName.trim().length > 0;

  //edit: 목표 선택 없어도 저장 가능
  const canSave = isEdit ? isValidFolderName(folderName) : !!pickedGoal && isValidFolderName(folderName);

  //========================
  //목표 로드(API)
  //========================
  const fetchGoals = useCallback(async () => {
    try {
      const list = await goalApi.getGoalList();
      setGoals(list.map(toUiGoalItem));
    } catch (e) {
      console.error(e);
      setGoals([]);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  //========================
  //edit 모드 프리필 (단 1회)
  //========================
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;

    if (!isEdit) {
      setPrefilled(true);
      return;
    }

    const goalIdFromQuery = searchParams.get("goalId");
    if (!goalIdFromQuery) {
      navigate("/home", { replace: true });
      return;
    }

    (async () => {
      try {
        const list = await folderApi.getFoldersByGoal(Number(goalIdFromQuery));
        const found = list.find((f) => String(f.id) === String(folderId));

        if (!found) {
          navigate("/home", { replace: true });
          return;
        }

        //STEP1 프리필 state 세팅
        setFolderName(found.name ?? "");
        setPickedGoalId(String(goalIdFromQuery));

        //STEP2 edit 진입 쿼리 정리 + 초기 canSave 세팅
        const next = new URLSearchParams(searchParams);
        next.set("mode", "edit");
        next.set("step", "2");
        next.set("folderId", String(folderId));
        next.set("goalId", String(goalIdFromQuery));
        next.set("canSave", isValidFolderName(found.name ?? "") ? "1" : "0");
        setSearchParams(next, { replace: true });

        setPrefilled(true);
      } catch (e) {
        console.error(e);
        navigate("/home", { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilled, isEdit, folderId, navigate]);

  //========================
  //헤더가 읽는 canSave 쿼리 반영
  //========================
  useEffect(() => {
    if (!prefilled) return;

    const next = new URLSearchParams(searchParams);
    next.set("canSave", canSave ? "1" : "0");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [prefilled, canSave, searchParams, setSearchParams]);

  //========================
  //저장 동작(create/edit 분기) - 서버 API
  //========================
  const handleSave = useCallback(async () => {
    if (!prefilled) return;
    if (!canSave) return;

    const nextName = folderName.trim();

    //edit
    if (isEdit && folderId) {
      try {
        await folderApi.updateFolder(Number(folderId), { folderName: nextName });

        const goalId = searchParams.get("goalId") ?? "";
        const goalName = searchParams.get("goalName") ?? "";
        const goalColor = searchParams.get("goalColor") ?? "";

        const q = new URLSearchParams();
        q.set("folderId", String(folderId));
        q.set("folderName", nextName);
        if (goalId) q.set("goalId", goalId);
        if (goalName) q.set("goalName", goalName);
        if (goalColor) q.set("goalColor", goalColor);

        navigate(`/folder?${q.toString()}`, {
          replace: true,
          state: { folderId: String(folderId), folderName: nextName, goalId, goalName, goalColor },
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }

    //create
    if (!pickedGoal) return;

    try {
      await folderApi.addFolder(Number(pickedGoal.id), { folderName: nextName });
      navigate("/home");
    } catch (e) {
      console.error(e);
    }
  }, [prefilled, canSave, isEdit, folderId, folderName, pickedGoal, navigate, searchParams]);

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
        <p className="mt-2 text-[14px] font-medium leading-normal text-green-normal">목표를 작게 나눌수록 달성하기 쉬워요</p>
      ) : null}

      {pickedGoal ? (
        <div className="mt-6 flex items-center gap-2">
          <FlagSvg className="h-4 w-4" style={{ color: getFolderNormalVar(pickedGoal.color) }} />
          <div className="text-[12px] font-semibold text-grey-normal">{pickedGoal.title}</div>
        </div>
      ) : null}

      <div className="mt-8">
        <UnderlineBox
          key={isEdit ? `edit-${folderId}-${prefilled}` : `create-${pickedGoalId}-${safeStep}`}
          label="폴더 이름"
          mode="input"
          active={folderActive}
          focused={folderFocused && !folderActive}
          accentColor={ACCENT_BLACK}
          inputValue={folderName}
          onInputChange={(v) => setFolderName(v.slice(0, 20))}
          onInputFocus={() => setFolderFocused(true)}
          onInputBlur={() => setFolderFocused(false)}
          onInputCompositionStart={() => setIsComposing(true)}
          onInputCompositionEnd={() => setIsComposing(false)}
        />
      </div>
    </div>
  );
}
