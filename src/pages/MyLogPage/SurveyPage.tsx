import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConfirmModal from "@/components/ConfirmModal";

type Choice = {
  id: string;
  label: string;
};

type Question =
  | {
      id: string;
      type: "single";
      title: string;
      choices: Choice[];
    }
  | {
      id: string;
      type: "text";
      title: string;
      placeholder: string;
      maxLen: number;
    };

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseYmd = (raw: string | null) => {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "single",
    title: "오늘 하루는 만족스러웠나요?",
    choices: [
      { id: "sat", label: "만족스러웠어요" },
      { id: "so", label: "그저 그랬어요" },
      { id: "unsat", label: "아쉬웠어요" },
    ],
  },
  {
    id: "q2",
    type: "single",
    title: "계획한 일정은 얼마나 지켰나요?",
    choices: [
      { id: "all", label: "완벽하게 지켰어요." },
      { id: "most", label: "큰 틀에서 잘 따랐어요." },
      { id: "half", label: "절반 이상은 지켰어요." },
      { id: "few", label: "계획이 자주 어긋났어요." },
      { id: "none", label: "계획과는 아주 다른 하루였어요." },
    ],
  },
  {
    id: "q3",
    type: "text",
    title: "잘한 점과 아쉬운 점은 무엇인가요?",
    placeholder: "구체적인 행동과 성과, 계획했지만 실천하지 못한 일과 그 이유를 기록해보세요.",
    maxLen: 100,
  },
];

const mockInitialAnswers = {
  q1: "sat",
  q2: "most",
  q3: "사이드 프로젝트 팀원들과 비대면 모각코를 진행해 2시간 이상 집중했다!\nSQLD 2.1 단원별 3시간이나 공부했다.\n예상 소요 시간보다 1시간 더 걸렸다.",
} as const;

const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const storageKey = (d: Date) => `mylog:survey:${toYmd(d)}`;

export default function SurveyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const date = useMemo(() => {
    const d = parseYmd(searchParams.get("date"));
    return d ?? new Date();
  }, [searchParams]);

  const key = useMemo(() => storageKey(date), [date]);

  const initial = useMemo(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return mockInitialAnswers;
      const parsed = JSON.parse(raw) as { q1?: string; q2?: string; q3?: string };
      return {
        q1: parsed.q1 ?? mockInitialAnswers.q1,
        q2: parsed.q2 ?? mockInitialAnswers.q2,
        q3: parsed.q3 ?? mockInitialAnswers.q3,
      };
    } catch {
      return mockInitialAnswers;
    }
  }, [key]);

  const [single, setSingle] = useState<Record<string, string>>({
    q1: initial.q1,
    q2: initial.q2,
  });
  const [text, setText] = useState<string>(initial.q3);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setSingle({ q1: initial.q1, q2: initial.q2 });
    setText(initial.q3);
  }, [initial.q1, initial.q2, initial.q3]);

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ q1: single.q1 ?? "", q2: single.q2 ?? "", q3: text ?? "" })
        );
      } catch {}
    }, 150);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [key, single.q1, single.q2, text]);

  const onDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setConfirmOpen(false);
    navigate(-1);
  };

  useEffect(() => {
    const handler = () => onDelete();
    window.addEventListener("survey:delete", handler as any);
    return () => window.removeEventListener("survey:delete", handler as any);
  }, [key]);

  const setChoice = (qid: string, cid: string) => {
    setSingle((prev) => ({ ...prev, [qid]: prev[qid] === cid ? "" : cid }));
  };

  const onChangeText = (v: string, maxLen: number) => {
    setText(v.slice(0, maxLen));
  };

  return (
    <div className="min-h-dvh bg-white">
      <div className="px-5 pt-2">
        <div className="mt-6 space-y-9.75 pb-10">
          {QUESTIONS.map((q, idx) => {
            if (q.type === "single") {
              return (
                <section key={q.id}>
                  <div className="text-title-16 font-medium text-grey-dark">{idx + 1}. {q.title}</div>
                  <div className="mt-3 space-y-1">
                    {q.choices.map((c) => {
                      const picked = single[q.id] === c.id;
                      const active = picked;

                      const base = "w-full rounded-[3px] border px-5 py-3.25 text-left text-title-14 font-medium";
                      const cls = active
                        ? `${base} border-transparent bg-grey-light text-grey-dark`
                        : `${base} border-grey-light bg-white text-grey-dark`;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setChoice(q.id, c.id)}
                          className={cls}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (q.type !== "text") return null;

            const count = `${text.length}/${q.maxLen}`;

            return (
              <section key={q.id}>
                <div className="text-title-16 font-medium text-grey-dark">
                  {idx + 1}. {q.title}
                </div>
                <div className="mt-3">
                  <div className="min-h-23 w-full rounded-[10px] border border-grey-light bg-white px-5 py-3">
                    <div className="relative min-h-23 w-full">
                      <textarea
                        value={text}
                        onChange={(e) => onChangeText(e.target.value, q.maxLen)}
                        placeholder={q.placeholder}
                        maxLength={q.maxLen}
                        className="h-23 w-full resize-none text-title-14 text-grey-dark outline-none placeholder:text-grey-light-active"
                      />
                      <div className="pointer-events-none absolute bottom-0 right-0 text-[12px] text-grey-light-active">
                        {count}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="일지를 삭제하시겠어요?"
        description="삭제한 일지는 복구되지 않습니다"
        cancelText="취소"
        confirmText="삭제"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <div className="pb-4" />
    </div>
  );
}
