/**
 * TaskInfoModal (UI 컴포넌트)
 * ------------------------------------------------------------
 * 역할:
 * - "할 일 정보" 바텀시트/모달 UI만 담당하는 프레젠테이션 컴포넌트
 * - API 호출/데이터 변환/상태 관리는 절대 하지 않음 (props로 받은 값만 렌더)
 *
 * 언제 쓰나:
 * - 부모 페이지(FolderPage 등)에서 이미 할 일 데이터를 갖고 있고,
 *   모달은 "표시"만 하면 될 때.
 *
 * 입력(props) 개념:
 * - open: 모달 열림 여부
 * - title / durationText / priorityText: 표시할 텍스트(이미 가공된 값)
 * - modalDateText / modalTimeText: 상단 날짜/시간 문자열(이미 계산된 값)
 * - isDone: 완료 상태(버튼 문구/스타일 분기)
 * - onClose / onEditStep1 / onEditStep2 / onDelete / onToggleDone: 버튼 액션 핸들러
 *
 * 주의:
 * - 이 컴포넌트는 "모달을 열었을 때 detail API를 호출해서 값 채우는" 일을 하지 않음.
 *   그런 흐름이 필요하면 TaskInfoModalContainer를 사용하거나,
 *   부모에서 데이터 준비 후 이 UI 컴포넌트에 props로 내려줘야 함.
 *
  //사용법(실데이터 예시)
  //1) FolderPage 같은 부모에서 openTask(리스트 데이터) + modalDateText/modalTimeText(상세조회/계산 결과)를 준비했다고 가정
  //
  //예) openTask = {
  //  id: "12",
  //  title: "알고리즘 과제",
  //  durationMinutes: 90,
  //  priority: "상",
  //  isDone: false,
  //  _startAt: "2026-02-20T10:00:00.000Z"
  //}
  //
  //예) modalDateText = "02/20"
  //예) modalTimeText = "10:00 - 11:30"
  //
  //<TaskInfoModal
  //  open={true}                           //Boolean(openTask)
  //  title={"알고리즘 과제"}               //openTask.title
  //  durationText={"1H 30M"}               //formatDuration(openTask.durationMinutes)
  //  priorityText={"상"}                   //openTask.priority
  //  isDone={false}                        //openTask.isDone
  //  modalDateText={"02/20"}               //buildModalDateTimeTexts(dto).dateText
  //  modalTimeText={"10:00 - 11:30"}       //buildModalDateTimeTexts(dto).timeText
  //  onClose={() => setOpenTaskId(null)}
  //  onEditStep1={() => navigate("/task?step=1&taskId=12")}
  //  onEditStep2={() => navigate("/task?step=2&taskId=12")}
  //  onDelete={async () => { await taskApi.deleteTodo(12); await load(); }}
  //  onToggleDone={async () => { await taskApi.updateTodoStatus(12, { state: "complete" }); await load(); }}
  ///>
 */
import NextDarkSvg from "@/assets/next-dark.svg?react";

type TaskInfoModalProps = {
  open: boolean;

  //STEP1 표시 데이터
  title: string;
  durationText: string;
  priorityText: string;
  isDone: boolean;

  //STEP2 상단 시간/날짜
  modalDateText: string;
  modalTimeText: string;

  //STEP3 액션
  onClose: () => void;
  onEditStep1: () => void;
  onEditStep2: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
};

export default function TaskInfoModal(props: TaskInfoModalProps) {
  const {
    open,
    title,
    durationText,
    priorityText,
    isDone,
    modalDateText,
    modalTimeText,
    onClose,
    onEditStep1,
    onEditStep2,
    onDelete,
    onToggleDone,
  } = props;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-4 pb-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-105 rounded-[14px] bg-white p-6 shadow-[0_0_10px_0_rgba(15,15,15,0.04)]">
        {/*헤더:타이틀+닫기*/}
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-normal text-[#00B1A6]">할 일 정보</div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 place-items-center rounded-md text-[#767676] hover:bg-black/5 active:bg-black/10"
            aria-label="close"
          >
            <span className="text-[18px] leading-none">×</span>
          </button>
        </div>

        {/*날짜+시간*/}
        <div className="mt-4 text-center text-[14px] font-semibold text-[#767676]">{modalDateText}</div>
        <div className="mt-2 text-center font-pretendard text-[28px] font-semibold leading-normal text-[#2C2C2C]">
          {modalTimeText}
        </div>

        <div className="mt-6 space-y-3">
          {/*이름*/}
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-normal text-[#767676]">이름</div>
            <button
              type="button"
              onClick={onEditStep1}
              className="group flex items-center gap-2 rounded-md px-2 py-1 text-right text-[14px] font-semibold text-gray-700 hover:bg-black/5 active:bg-black/10"
            >
              <span className="max-w-55 truncate">{title}</span>
              <NextDarkSvg className="h-3.5 w-3.5" />
            </button>
          </div>

          {/*소요시간*/}
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-normal text-[#767676]">예상 소요 시간</div>
            <button
              type="button"
              onClick={onEditStep1}
              className="group flex items-center gap-2 rounded-md px-2 py-1 text-right text-[14px] font-semibold text-gray-700 hover:bg-black/5 active:bg-black/10"
            >
              <span>{durationText}</span>
              <NextDarkSvg className="h-3.5 w-3.5" />
            </button>
          </div>

          {/*중요도*/}
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-normal text-[#767676]">중요도</div>
            <button
              type="button"
              onClick={onEditStep2}
              className="group flex items-center gap-2 rounded-md px-2 py-1 text-right text-[14px] font-semibold text-gray-700 hover:bg-black/5 active:bg-black/10"
            >
              <span>{priorityText}</span>
              <NextDarkSvg className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onDelete}
            className={[
              "flex h-10.5 w-22 items-center justify-center rounded-md border border-[#C2C2C2] bg-white text-[14px] font-semibold text-[#3A3A3A]",
              "hover:bg-red-100 hover:text-red-600 active:bg-red-200",
            ].join(" ")}
          >
            삭제
          </button>

          <button
            type="button"
            onClick={onToggleDone}
            className={[
              "h-10.5 flex-1 rounded-md bg-[#F1F1F1] text-[14px] font-semibold text-[#767676]",
              isDone ? "hover:bg-gray-200 hover:text-gray-700 active:bg-gray-300" : "hover:bg-green-100 hover:text-green-700 active:bg-green-200",
            ].join(" ")}
          >
            {isDone ? "완료 취소하기" : "할 일 완료하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
