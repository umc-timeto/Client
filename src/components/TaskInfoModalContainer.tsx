/**
 * TaskInfoModalContainer (Container 컴포넌트)
 * ------------------------------------------------------------
 * 역할:
 * - "할 일 정보 모달"에서 필요한 서버 데이터 호출 + 변환 + UI 전달까지 담당
 * - 내부에서 taskApi 등을 호출하여 detail(todo) 정보를 가져오고,
 *   날짜/시간 표시 문자열을 계산(buildModalDateTimeTexts)해서 UI에 주입
 *
 * 구성:
 * - 내부에서 TaskInfoModal(UI)을 렌더링하고, 필요한 값을 props로 내려줌
 *
 * 언제 쓰나:
 * - 어떤 페이지든 "todoId만 알고 있고",
 *   모달을 열 때마다 detail API 호출 → 데이터 로딩 → 표시까지 자동으로 하고 싶을 때.
 * - 페이지마다 동일한 로직(상세조회/시간계산/문구 생성)을 중복하기 싫을 때.
 *
 * 입력(props) 개념(보통 이런 형태):
 * - open: 모달 열림 여부
 * - todoId: 상세 조회할 todo id
 * - onClose: 닫기
 * - onEdit/onDelete/onToggleDone: 액션 콜백 (성공 시 부모가 리스트 reload 하는 식)
 *
 * 주의(성능/중복 호출):
 * - 이미 부모 페이지에서 detail 데이터를 갖고 있다면
 *   컨테이너를 또 쓰면 호출이 중복될 수 있음.
 *   그 경우엔 TaskInfoModal(UI)만 쓰는 게 더 깔끔함.
 *
  //사용법(실데이터 예시)
  //- 모달을 열 때 todoId만 알고 있음 → 컨테이너가 detail API 호출 + 날짜/시간 계산까지 처리
  //
  //예) openTaskId = "12"
  //예) taskApi.getTodo(12) 응답(dto) 일부:
  //{
  //  todoId: 12,
  //  name: "알고리즘 과제",
  //  duration: "1H 30M",
  //  priority: "HIGH",
  //  startAt: "2026-02-20T10:00:00.000Z",
  //  state: "progress"
  //}
  //
  //<TaskInfoModalContainer
  //  open={true}
  //  todoId={12}
  //  onClose={() => setOpen(false)}
  //  onEditStep1={() => navigate("/task?step=1&taskId=12")}
  //  onEditStep2={() => navigate("/task?step=2&taskId=12")}
  //  onDelete={async (id) => { await taskApi.deleteTodo(id); await load(); }}
  //  onToggleDone={async (id, nextState) => { await taskApi.updateTodoStatus(id, { state: nextState }); await load(); }}
  ///>
  //
  //컨테이너 내부에서 자동으로 이런 값이 만들어져 UI로 내려감:
  //- title: dto.name => "알고리즘 과제"
  //- durationText: formatDuration(parseApiDurationToMinutes(dto.duration)) => "1H 30M"
  //- priorityText: apiPriorityToUi(dto.priority) => "상"
  //- modalDateText/modalTimeText: buildModalDateTimeTexts({ startAt: dto.startAt, duration: dto.duration })
  //  => dateText: "02/20", timeText: "10:00 - 11:30"
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import TaskInfoModal from "@/components/TaskInfoModal";
import { taskApi } from "@/apis/TaskPage/task.api";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMMDD(d: Date) {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

function formatHHMM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDuration(minutes: number) {
  const m = Math.max(0, minutes ?? 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}H ${mm}M`;
  if (h > 0) return `${h}H`;
  return `${mm}M`;
}

function parseApiDurationToMinutes(v: string | null | undefined): number {
  const s = String(v ?? "").trim();
  if (!s) return 0;

  const hMatch = s.match(/(\d+)\s*H/i);
  const mMatch = s.match(/(\d+)\s*M/i);

  const h = hMatch ? Number(hMatch[1]) : 0;
  const m = mMatch ? Number(mMatch[1]) : 0;

  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, h * 60 + m);
}

type TaskInfoModalContainerProps = {
  open: boolean;
  todoId: number | null;

  //STEP1 공통 액션
  onClose: () => void;
  onEditStep1: () => void;
  onEditStep2: () => void;

  //STEP2 변경 후 부모에게 알려서 목록 갱신
  onChanged?: () => void;
};

export default function TaskInfoModalContainer(props: TaskInfoModalContainerProps) {
  const { open, todoId, onClose, onEditStep1, onEditStep2, onChanged } = props;

  //STEP1 detail 데이터
  const [title, setTitle] = useState("");
  const [priorityText, setPriorityText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [isDone, setIsDone] = useState(false);

  //STEP2 상단 날짜/시간
  const [modalDateText, setModalDateText] = useState("--/--");
  const [modalTimeText, setModalTimeText] = useState("00:00-00:00");

  const safeTodoId = useMemo(() => {
    if (!todoId) return null;
    if (!Number.isFinite(todoId)) return null;
    return todoId;
  }, [todoId]);

  //STEP3 detail 조회
  useEffect(() => {
    if (!open) return;
    if (!safeTodoId) return;

    let alive = true;

    (async () => {
      try {
        const dto = await taskApi.getTodo(safeTodoId);

        if (!alive) return;

        setTitle(dto.name ?? "");
        setPriorityText(dto.priority === "HIGH" ? "상" : dto.priority === "MEDIUM" ? "중" : "하");

        const minutes = parseApiDurationToMinutes(dto.duration);
        setDurationText(formatDuration(minutes));

        const done = dto.state === "complete";
        setIsDone(done);

        if (!dto.startAt) {
          setModalDateText("--/--");
          setModalTimeText("00:00-00:00");
          return;
        }

        const start = new Date(dto.startAt);
        const end = new Date(start.getTime() + minutes * 60 * 1000);

        setModalDateText(formatMMDD(start));
        setModalTimeText(`${formatHHMM(start)} - ${formatHHMM(end)}`);
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setTitle("");
        setPriorityText("");
        setDurationText("");
        setIsDone(false);
        setModalDateText("--/--");
        setModalTimeText("-");
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, safeTodoId]);

  //STEP4 삭제
  const onDelete = useCallback(async () => {
    if (!safeTodoId) return;

    try {
      await taskApi.deleteTodo(safeTodoId);
      onClose();
      onChanged?.();
    } catch (e) {
      console.error(e);
    }
  }, [safeTodoId, onClose, onChanged]);

  //STEP5 완료 토글
  const onToggleDone = useCallback(async () => {
    if (!safeTodoId) return;

    try {
      await taskApi.updateTodoStatus(safeTodoId, { state: isDone ? "progress" : "complete" });
      onClose();
      onChanged?.();
    } catch (e) {
      console.error(e);
    }
  }, [safeTodoId, isDone, onClose, onChanged]);

  return (
    <TaskInfoModal
      open={open}
      title={title}
      durationText={durationText}
      priorityText={priorityText}
      isDone={isDone}
      modalDateText={modalDateText}
      modalTimeText={modalTimeText}
      onClose={onClose}
      onEditStep1={onEditStep1}
      onEditStep2={onEditStep2}
      onDelete={onDelete}
      onToggleDone={onToggleDone}
    />
  );
}
