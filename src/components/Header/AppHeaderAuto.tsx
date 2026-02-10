/**
 * 현재 라우트(pathname)와 쿼리 파라미터를 기준으로
 * 헤더의 제목, 좌/우 액션 버튼, 상태바 포함 여부를 자동으로 결정하는 컴포넌트입니다.
 * 
 * 이 컴포넌트는 페이지에서 헤더를 직접 제어하지 않도록 설계되었으며,
 * 모든 헤더 UI 정책은 이 파일에서 중앙 집중적으로 관리됩니다.
 * 
 * @param props
 * @param props.onOpenDrawer - 좌측 메뉴 버튼 클릭 시 호출되는 콜백 (선택)
 * @param props.onOpenFolderMenu - 폴더 페이지 우측 메뉴 버튼 클릭 시 호출되는 콜백 (선택)
 * @param props.onComplete - "저장", "완료" 등 우측 텍스트 버튼 클릭 시 호출되는 콜백 (선택)
 * 
 * @returns 현재 라우트에 맞게 구성된 Header 컴포넌트
 * 
 * @remarks
 * 지원하는 라우트별 헤더 구성은 다음과 같습니다.
 * 
 * - `/home`
 *   - 제목: "내 목표"
 *   - 좌측: 메뉴 버튼
 *   - 우측: 추가 버튼
 * 
 * - `/goal`
 *   - 목표 추가 화면
 *   - 좌측: 닫기 버튼
 *   - 우측: 저장 버튼 (showSave / canSave 쿼리로 표시 및 활성화 제어)
 * 
******* 주의사항 *******
 * - `location.state`로 전달된 값은 새로고침 시 유지되지 않습니다.
 * - 따라서 폴더명(`folderName`)은 `location.state`를 우선 사용하되,
 *   새로고침/직접 접근을 대비해 `?folderName=` 쿼리를 fallback으로 함께 사용합니다.
 * - 폴더 페이지로 이동할 때는 다음과 같이 state + query를 동시에 전달하는 것을 권장합니다.
 *   
 *   navigate(`/folder?folderName=${encodeURIComponent(String(folderName))}`, {
 *     state: { folderName }
 *   });
 * 
******* 쿼리 기반 헤더 제어 관련 주의사항 *******
 * 
 * - `/goal` 페이지
 *   - 우측 "저장" 버튼은 기본적으로 표시되지 않습니다.
 *   - 사용자가 입력을 시작한 시점에 `showSave=1` 쿼리를 설정해야 버튼이 나타납니다.
 *   - 모든 필수 입력이 유효한 상태가 되었을 때 `canSave=1` 쿼리를 설정해야 버튼이 활성화됩니다.
 * 
 * - `/task` 페이지 (단계형 플로우)
 *   - step=1 (기본값): 우측 버튼은 "다음"이며, `canNext=1`일 때만 활성화됩니다.
 *   - step=2: 우측 버튼은 "저장"이며, `canSave=1`일 때만 활성화됩니다.
 *   - step 전환은 페이지가 아닌 헤더에서 수행되며, 쿼리 변경으로 처리됩니다.
 * 
 * 위 쿼리 값들은 페이지 내부 상태(입력/선택 여부)에 따라 페이지 구현자가 설정해야 하며,
 * 헤더 컴포넌트는 해당 쿼리를 기준으로 UI 상태만 반영합니다.
 * 
 * - `/folder`
 *   - 폴더 상세 화면
 *   - 좌측: 뒤로가기 버튼
 *   - 우측: 폴더 메뉴 버튼
 * 
 * - `/folder/select`
 *   - 폴더 내부 목표 선택 화면
 *   - 좌측: 닫기 버튼
 *   - 우측: 완료 버튼
 *   - 완료 버튼 클릭 시 상위 폴더 생성/연결 플로우로 이어짐
 * 
 * - `/task`
 *   - 할 일 추가 화면 (단계형 플로우)
 *   - step 쿼리를 사용하여 "다음" → "저장" 버튼 전환
 *   - canNext / canSave 쿼리로 버튼 활성화 상태 제어
 * 
 * - `/timeblock`
 *   - 상태바 포함 헤더
 *   - 좌측: 캘린더 버튼
 *   - 우측: 추가 버튼
 * 
 * - `/mylog`
 *   - 상태바 포함 헤더
 *   - 좌측: 메뉴 버튼
 * 
 * 사용되는 쿼리 파라미터 규칙:
 * 
 * - `step`
 *   - 다단계 입력 화면에서 현재 단계 (기본값: 1)
 * 
 * - `showSave`
 *   - 저장 버튼을 표시할지 여부
 * 
 * - `canSave`
 *   - 저장 버튼 활성화 여부
 * 
 * - `canNext`
 *   - 다음 버튼 활성화 여부
 * 
 * 페이지 구현자는 필요할 경우에만 위 쿼리를 읽어 화면을 분기하면 되며,
 * 헤더 UI 제어를 위해 별도의 코드를 작성할 필요는 없습니다.
 */

import { useLocation, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";

import AddSvg from "@/assets/add.svg?react";
import CalendarSvg from "@/assets/calendar.svg?react";
import CloseSvg from "@/assets/close.svg?react";
import MenuSvg from "@/assets/menu.svg?react";
import Menu2Svg from "@/assets/menu2.svg?react";
import PrevSvg from "@/assets/prev.svg?react";

import { HeaderBase, StatusHeaderBase } from "./HeaderBase";
import HeaderIconButton from "./HeaderIconButton";

import { useHeaderActions } from "@/contexts/HeaderActionContext";

type AppHeaderAutoProps = {
  onOpenDrawer?: () => void;
  onOpenFolderMenu?: () => void;
}; //onComplete?: () => void; 제거

type RootOutletContext = {
  openDrawer?: () => void;
};

//onComplete 를 context에서 가져오도록 수정
export default function AppHeaderAuto({ onOpenDrawer, onOpenFolderMenu}: AppHeaderAutoProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const outletContext = useOutletContext<RootOutletContext>();

  const path = location.pathname;

  const [searchParams, setSearchParams] = useSearchParams();
  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = Number.isFinite(step) ? step : 1;

  const { onComplete } = useHeaderActions(); //추가

  const noop = () => {};
  const openDrawer = outletContext?.openDrawer ?? onOpenDrawer ?? noop;
  const openFolderMenu = onOpenFolderMenu ?? noop;
  const complete = onComplete ?? noop;

  const setStep = (nextStep: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("step", String(nextStep));
    setSearchParams(next, { replace: true });
  };

  const goBack = () => navigate(-1);

  const RightTextButton = ({
    label,
    onClick,
    disabled,
  }: {
    label: string | undefined;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      className={`px-2 text-title-20 font-semibold ${
        disabled ? "text-[#B0B0B0]" : "text-[#006fff]"
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );

  const getQueryFlag = (key: string) => {
    const v = searchParams.get(key);
    if (!v) return false;
    return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
  };

  let folderName = "location.state로 전달된 folderName";

  if (location.state && typeof location.state === "object" && "folderName" in location.state) {
    const v = (location.state as any).folderName;
    const s = typeof v === "number" ? String(v) : typeof v === "string" ? v : "";
    if (s.trim().length > 0) folderName = s;
  } else {
    const q = searchParams.get("folderName") ?? "";
    if (q.trim().length > 0) folderName = q;
  }

  if (path === "/home") {
    return (
      <HeaderBase
        title="내 목표"
        left={
          <HeaderIconButton ariaLabel="menu" onClick={openDrawer}>
            <MenuSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
        right={
          <HeaderIconButton ariaLabel="add" onClick={() => navigate("/goal")}>
            <AddSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
      />
    );
  }

  if (path === "/goal") {
    const showSave = getQueryFlag("showSave");
    const canSave = getQueryFlag("canSave");

    return (
      <HeaderBase
        title="목표 추가"
        left={
          <HeaderIconButton ariaLabel="close" onClick={goBack}>
            <CloseSvg className="h-7.5 w-7.5" />
          </HeaderIconButton>
        }
        right={
          showSave ? (
            <RightTextButton label="저장" onClick={complete} disabled={!canSave} />
          ) : undefined
        }
      />
    );
  }

  if (path === "/folder") {
    return (
      <HeaderBase
        title={folderName}
        left={
          <HeaderIconButton ariaLabel="prev" onClick={goBack}>
            <PrevSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
        right={
          <HeaderIconButton ariaLabel="folder menu" onClick={openFolderMenu}>
            <Menu2Svg className="h-7 w-7" />
          </HeaderIconButton>
        }
      />
    );
  }


  if (path === "/folder/select") {
    return (
      <HeaderBase
        title="목표 선택"
        left={
          <HeaderIconButton ariaLabel="close" onClick={goBack}>
            <CloseSvg className="h-7.5 w-7.5" />
          </HeaderIconButton>
        }
        right={<RightTextButton label=" " onClick={noop} />}
      />
    );
  }

  if (path === "/task") {
    const canNext = getQueryFlag("canNext");
    const canSave = getQueryFlag("canSave");

    return (
      <HeaderBase
        title="할 일 추가"
        left={
          <HeaderIconButton ariaLabel="close" onClick={goBack}>
            <CloseSvg className="h-7.5 w-7.5" />
          </HeaderIconButton>
        }
        right={
          safeStep >= 2 ? (
            <RightTextButton label="저장" onClick={complete} disabled={!canSave} />
          ) : (
            <RightTextButton label="다음" onClick={() => setStep(2)} disabled={!canNext} />
          )
        }
      />
    );
  }

  if (path === "/timeblock") {
    return (
      <StatusHeaderBase
        title=""
        left={
          <HeaderIconButton ariaLabel="calendar" onClick={noop}>
            <CalendarSvg className="h-6.25 w-6.25" />
          </HeaderIconButton>
        }
        right={
          <HeaderIconButton ariaLabel="add" onClick={() => navigate("/timeblock/create")}>
            <AddSvg className="h-6.25 w-6.25" />
          </HeaderIconButton>
        }
      />
    );
  }

  if (path === "/mylog") {
    return (
      <StatusHeaderBase
        title=""
        left={
          <HeaderIconButton ariaLabel="menu" onClick={openDrawer}>
            <MenuSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
      />
    );
  }

  return <HeaderBase title="" />;
}