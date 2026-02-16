import { useLocation, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useTimeBlockCreateStore } from "@/constants/timeBlockCreateStore";

import AddSvg from "@/assets/add.svg?react";
import CloseSvg from "@/assets/close.svg?react";
import MenuSvg from "@/assets/menu.svg?react";
import Menu2Svg from "@/assets/menu2.svg?react";
import PrevSvg from "@/assets/prev.svg?react";
import CalPrevSvg from "@/assets/cal_prev.svg?react";
import CalNextSvg from "@/assets/cal_next.svg?react";

import { HeaderBase, StatusHeaderBase } from "./HeaderBase";
import HeaderIconButton from "./HeaderIconButton";

import { useHeaderActions } from "@/contexts/HeaderActionContext";

type AppHeaderAutoProps = {
  onOpenDrawer?: () => void;
  onOpenFolderMenu?: () => void;
};

type RootOutletContext = {
  openDrawer?: () => void;
};

export default function AppHeaderAuto({ onOpenDrawer, onOpenFolderMenu }: AppHeaderAutoProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const outletContext = useOutletContext<RootOutletContext>();
  
  const path = location.pathname;

  const pickedCreateTask = useTimeBlockCreateStore((s) => s.pickedTask);

  const [searchParams, setSearchParams] = useSearchParams();
  const stepRaw = searchParams.get("step");
  const step = Number(stepRaw ?? "1");
  const safeStep = Number.isFinite(step) ? step : 1;

  const { onComplete } = useHeaderActions();

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

  const requestTimeBlockCreateSave = () => {
    window.dispatchEvent(new CustomEvent("timeblockCreate:save"));
  };

  const requestHomeAddOpen = () => {
    window.dispatchEvent(new CustomEvent("home:add"));
  };

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
      className={`text-[20px] font-normal ${disabled ? "text-grey-light-active" : "text-yellow-normal"}`}
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
          <HeaderIconButton ariaLabel="add" onClick={requestHomeAddOpen}>
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
            <CloseSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
        right={showSave ? <RightTextButton label="저장" onClick={complete} disabled={!canSave} /> : undefined}
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
          <HeaderIconButton ariaLabel="close" onClick={goBack}>            <CloseSvg className="h-7 w-7" />
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
            <CloseSvg className="h-7 w-7" />
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
    const rawYm = searchParams.get("ym");
    const rawDate = searchParams.get("date");
    const rawW = searchParams.get("w");

    const today = new Date();
    const fallbackYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const ym = rawYm && /^\d{4}-\d{2}$/.test(rawYm) ? rawYm : fallbackYm;

    const formatYearMonthFromYm = (v: string) => {
      const [y, m] = v.split("-");
      return `${y}년 ${Number(m)}월`;
    };

    const shiftYm = (v: string, delta: number) => {
      const [y, m] = v.split("-");
      const base = new Date(Number(y), Number(m) - 1 + delta, 1);
      return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
    };

    const view = searchParams.get("view");

    const ymFromYmd = (v: string | null) => {
      if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
      const [y, m] = v.split("-");
      return `${y}-${m}`;
    };

    const titleYm = view === "week" ? ymFromYmd(rawW) ?? ymFromYmd(rawDate) ?? ym : ym;

    const goMonth = (delta: number) => {
      const nextYm = shiftYm(ym, delta);
      const next = new URLSearchParams(searchParams);
      next.set("ym", nextYm);
      setSearchParams(next);
    };

    const goWeek = (delta: number) => {
      const rawW = searchParams.get("w");
      const rawDate = searchParams.get("date");
      const now = new Date();

      let base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const seed = rawW ?? rawDate;
      if (seed && /^\d{4}-\d{2}-\d{2}$/.test(seed)) {
        const [y, m, d] = seed.split("-");
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        if (!isNaN(dt.getTime())) base = dt;
      }

      const nextW = new Date(base);
      nextW.setDate(nextW.getDate() + delta * 7);

      const next = new URLSearchParams(searchParams);
      next.set(
        "w",
        `${nextW.getFullYear()}-${String(nextW.getMonth() + 1).padStart(2, "0")}-${String(nextW.getDate()).padStart(2, "0")}`
      );
      next.set("ym", `${nextW.getFullYear()}-${String(nextW.getMonth() + 1).padStart(2, "0")}`);
      setSearchParams(next);
    };

    return (
      <StatusHeaderBase
        title={
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="previous"
              onClick={() => (view === "week" ? goWeek(-1) : goMonth(-1))}
            >
              <CalPrevSvg className="h-7 w-7" />
            </button>

            <div className="text-[20px] font-semibold text-grey-dark">{formatYearMonthFromYm(titleYm)}</div>

            <button
              type="button"
              aria-label="next"
              onClick={() => (view === "week" ? goWeek(1) : goMonth(1))}
            >
              <CalNextSvg className="h-7 w-7" />
            </button>
          </div>
        }
        left={
          <HeaderIconButton ariaLabel="menu" onClick={openDrawer}>
            <MenuSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
        right={
          <HeaderIconButton ariaLabel="add" onClick={() => navigate("/timeblock/create/goal")}>
            <AddSvg className="h-6.25 w-6.25" />
          </HeaderIconButton>
        }
      />
    );
  }

  if (path === "/timeblock/create/goal" || path === "/timeblock/create/folder") {
    return (
      <HeaderBase
        title="타임 블록 추가"
        left={
          <HeaderIconButton ariaLabel="close" onClick={goBack}>
            <CloseSvg className="h-7.5 w-7.5" />
          </HeaderIconButton>
        }
        right={
          <HeaderIconButton ariaLabel="spacer" onClick={noop}>
            <MenuSvg className="h-7 w-7 opacity-0" />
          </HeaderIconButton>
        }
      />
    );
  }

  if (path === "/timeblock/create/task") {
    const canSave = Boolean(pickedCreateTask);

    return (
      <HeaderBase
        title="타임 블록 추가"
        left={
          <HeaderIconButton ariaLabel="close" onClick={goBack}>
            <CloseSvg className="h-7.5 w-7.5" />
          </HeaderIconButton>
        }
        right={
          <RightTextButton
            label="저장"
            onClick={() => {
              requestTimeBlockCreateSave();
              navigate("/timeblock");
            }}
            disabled={!canSave}
          />
        }
      />
    );
  }

  if (path === "/mylog") {
    return (
      <StatusHeaderBase
        title="나의 일지"
        left={
          <HeaderIconButton ariaLabel="menu" onClick={openDrawer}>
            <MenuSvg className="h-7 w-7" />
          </HeaderIconButton>
        }
        right={
          <HeaderIconButton ariaLabel="spacer" onClick={noop}>
            <MenuSvg className="h-7 w-7 opacity-0" />
          </HeaderIconButton>
        }
      />
    );
  }

  if (path === "/survey") {
    const rawDate = searchParams.get("date");

    const parseYmdSafe = (v: string | null) => {
      if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
      const [y, m, d] = v.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return Number.isNaN(dt.getTime()) ? null : dt;
    };

    const dt = parseYmdSafe(rawDate) ?? new Date();
    const title = `${dt.getMonth() + 1}월 ${dt.getDate()}일`;

    const requestDelete = () => {
      window.dispatchEvent(new CustomEvent("survey:delete", { detail: { date: rawDate } }));
    };

    return (
      <StatusHeaderBase
        title={<div className="text-title-20 font-semibold text-grey-dark">{title}</div>}
        left={
          <HeaderIconButton ariaLabel="close" onClick={goBack}>
            <CloseSvg className="h-7.5 w-7.5" />
          </HeaderIconButton>
        }
        right={<RightTextButton label="삭제" onClick={requestDelete} />}
      />
    );
  }
  
  return <HeaderBase title="" />;
}