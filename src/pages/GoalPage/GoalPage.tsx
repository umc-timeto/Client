import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import UnderlineBox from "@/components/UnderlineBox";
import { useHeaderActions } from "@/contexts/HeaderActionContext";
import { goalPageApi } from "@/apis/GoalPage/goal.api";

type GoalColor = {
  key: string;
  name: string;
  hex: string;
};

//STEP1 피그마 팔레트(10개)
const GOAL_COLORS: GoalColor[] = [
  { key: "red", name: "레드", hex: "#FF8373" },
  { key: "orange", name: "오렌지", hex: "#F6AE14" },
  { key: "yellow", name: "옐로우", hex: "#FFE240" },
  { key: "lightGreen", name: "라이트그린", hex: "#D5F05F" },
  { key: "green", name: "그린", hex: "#75C7AD" },
  { key: "pink", name: "핑크", hex: "#FF9FD4" },
  { key: "purple", name: "퍼플", hex: "#C58BFF" },
  { key: "blue", name: "블루", hex: "#638FFF" },
  { key: "skyBlue", name: "스카이블루", hex: "#6FB7FF" },
  { key: "cyan", name: "사이언", hex: "#8AE6EE" },
];

//STEP2 헤더/라인/아이콘 강조 컬러
const ACCENT_YELLOW = "var(--color-yellow-normal)";

//STEP3 API 요청 바디 타입
type GoalCreateBody = {
  name: string;
  color: string;
};

//STEP4 목표 이름 검증(공백 포함 최대 20자, 공백만은 불가)
function isValidGoalTitle(v: string) {
  if (v.length > 20) return false;
  if (v.trim().length === 0) return false;
  return true;
}

//STEP5 아래 화살표 아이콘:stroke를 currentColor로 고정
function ChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

//STEP6 hex -> GoalColor 찾기(팔레트에 없으면 null)
function findColorByHex(hex: string) {
  const v = (hex ?? "").toUpperCase();
  return GOAL_COLORS.find((c) => c.hex.toUpperCase() === v) ?? null;
}

export default function GoalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setOnComplete } = useHeaderActions();

  //========================
  //STEP0 mode/edit 파라미터
  //========================
  const mode = searchParams.get("mode") ?? "create"; //create | edit
  const goalId = searchParams.get("goalId");
  const isEdit = mode === "edit" && !!goalId;

  const navState = location.state as { goalId?: string; title?: string; color?: string } | null;

  //========================
  //STEP1 입력/선택 상태
  //========================
  const [title, setTitle] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);

  const [color, setColor] = useState<GoalColor | null>(null);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  //========================
  //STEP2 edit 프리필(1회)
  //========================
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;

    if (!isEdit || !goalId) {
      setPrefilled(true);
      return;
    }

    //STEP2-1 HomePage에서 넘어온 state 우선
    const nextTitle = (navState?.title ?? "").slice(0, 20);
    const nextColorHex = navState?.color ?? "";

    if (nextTitle || nextColorHex) {
      setTitle(nextTitle);
      setColor(findColorByHex(nextColorHex));
      setPrefilled(true);
      return;
    }

    //STEP2-2 state가 없으면 서버에서 조회해서 goalId 매칭
    let cancelled = false;

    (async () => {
      try {
        const list = await goalPageApi.getGoalList();
        const target = list.find((g) => String(g.id) === goalId) ?? null;

        if (cancelled) return;

        setTitle((target?.name ?? "").slice(0, 20));
        setColor(findColorByHex(target?.color ?? ""));
        setPrefilled(true);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setPrefilled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prefilled, isEdit, goalId, navState]);

  //========================
  //STEP3 헤더 버튼 표시/활성화 조건
  //========================
  const titleActive = title.trim().length > 0;
  const titleValid = isValidGoalTitle(title);
  const colorActive = color !== null;

  //입력 시작 시점에 저장 버튼 표시
  const showSave = titleFocused || titleActive || colorModalOpen || colorActive;

  //이름+색상 모두 유효하면 저장 활성화
  const canSave = titleValid && colorActive;

  //색상 입력 라인/아이콘 활성 조건
  const colorFieldFocused = colorModalOpen && !colorActive;
  const chevronActive = colorModalOpen || colorActive;

  //========================
  //STEP4 API 요청 바디 생성
  //========================
  const buildGoalCreateBody = useCallback((): GoalCreateBody => {
    return {
      name: title.trim(),
      color: color?.hex ?? "",
    };
  }, [title, color]);

  //========================
  //STEP5 헤더(AppHeaderAuto)가 참조하는 showSave/canSave 쿼리 반영
  //========================
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (showSave) next.set("showSave", "1");
    else next.delete("showSave");

    next.set("canSave", canSave ? "1" : "0");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [showSave, canSave, searchParams, setSearchParams]);

  //========================
  //STEP6 모달 열릴 때 바디 스크롤 잠금
  //========================
  useEffect(() => {
    if (!colorModalOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [colorModalOpen]);

  //========================
  //STEP7 저장 동작(API 연동)
  //========================
  const [saving, setSaving] = useState(false);

const handleSave = useCallback(async () => {
  if (!canSave || saving) return;

  setSaving(true);
  const body = buildGoalCreateBody();

  try {
    if (isEdit && goalId) {
      await goalPageApi.updateGoal(Number(goalId), body);
      navigate("/home", { replace: true });
      return;
    }

    await goalPageApi.addGoal(body);
    navigate("/home", { replace: true });
  } catch (e) {
    console.error(e);
  } finally {
    setSaving(false);
  }
}, [canSave, saving, buildGoalCreateBody, isEdit, goalId, navigate]);


  //========================
  //STEP8 헤더 "저장" 버튼 동작 등록
  //========================
  useEffect(() => {
    setOnComplete(() => handleSave);
    return () => setOnComplete(null);
  }, [setOnComplete, handleSave]);

  //========================
  //UI
  //========================
  return (
    <div className="bg-white px-5 pt-8">
      {/*상단 안내 타이틀*/}
      <h1 className="text-[24px] font-bold leading-[33.6px] text-black">
        {isEdit ? (
          <>
            목표를
            <br />
            수정해주세요
          </>
        ) : (
          <>
            달성하고 싶은 목표를
            <br />
            입력해주세요
          </>
        )}
      </h1>

      {/*상단 안내 서브 텍스트*/}
      {!isEdit ? (
        <p className="mt-2 font-pretendard text-[14px] font-medium leading-normal text-green-normal">
          한 달 이상 지속할 장기 목표면 더 좋아요
        </p>
      ) : null}

      {/*목표 이름 입력*/}
      <div className="mt-10">
        <UnderlineBox
          label="목표 이름"
          mode="input"
          active={titleActive}
          focused={titleFocused && !titleActive}
          accentColor={ACCENT_YELLOW}
          inputValue={title}
          onInputChange={(v) => setTitle(v.slice(0, 20))}
          onInputFocus={() => setTitleFocused(true)}
          onInputBlur={() => setTitleFocused(false)}
        />
      </div>

      {/*색상 선택*/}
      <div className="mt-10">
        <UnderlineBox
          label="색상"
          mode="button"
          active={colorActive}
          focused={colorFieldFocused}
          accentColor={ACCENT_YELLOW}
          valueText={color ? color.name : ""}
          placeholder=" "
          onClick={() => setColorModalOpen(true)}
          leftSlot={
            color ? <div className="h-5 w-5 rounded-full" style={{ backgroundColor: color.hex }} /> : null
          }
          rightSlot={
            <div
              className={chevronActive ? "" : "text-gray-400"}
              style={chevronActive ? { color: ACCENT_YELLOW } : undefined}
            >
              <ChevronDown />
            </div>
          }
        />
      </div>

      {/*색상 선택 모달*/}
      {colorModalOpen ? (
        <>
          {/*모달 배경:헤더 포함 전체 덮기*/}
          <button
            type="button"
            className="fixed inset-0 z-999 bg-black/20"
            aria-label="close color modal"
            onClick={() => setColorModalOpen(false)}
          />

          {/*모달 바텀시트:가운데 정렬 고정 크기*/}
          <div className="fixed inset-x-0 bottom-0 z-1000 flex justify-center">
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="title-16-semibold text-gray-700">색상 선택</div>
                <button
                  type="button"
                  aria-label="close"
                  onClick={() => setColorModalOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center"
                >
                  <span className="text-[20px] leading-none text-gray-300">×</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {GOAL_COLORS.map((c) => {
                  const selected = color?.key === c.key;

                  return (
                    <button
                      key={c.key}
                      type="button"
                      aria-label={c.name}
                      onClick={() => {
                        setColor(c);
                        setColorModalOpen(false);
                      }}
                      className={[
                        "h-10 w-10 rounded-full",
                        selected ? "ring-2 ring-gray-700 ring-offset-2" : "",
                      ].join(" ")}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
