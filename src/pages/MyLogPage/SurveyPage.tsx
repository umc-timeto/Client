import { useEffect, useMemo, useRef, useState } from "react";
import { useAutoCreateLog } from "@/hooks/MyLogPage/useAutoCreateLog";
import { useAutoUpdateLog } from "@/hooks/MyLogPage/useAutoUpdateLog";
import { useLogDetail } from "@/hooks/MyLogPage/useLogDetail";
import type { Satisfaction, Achievement } from "@/apis/MyLogPage/logs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLogApi } from "@/apis/MyLogPage/deleteLog";
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


const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const storageKey = (d: Date) => `mylog:survey:${toYmd(d)}`;

export default function SurveyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const logIdParam = searchParams.get("logId") ?? searchParams.get("logid") ?? searchParams.get("id");
  const logId = useMemo(() => {
    const n = Number(logIdParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [logIdParam]);

  const date = useMemo(() => {
    const d = parseYmd(searchParams.get("date"));
    return d ?? new Date();
  }, [searchParams]);

  const key = useMemo(() => storageKey(date), [date]);

  const initial = { q1: "", q2: "", q3: "" };

  const [single, setSingle] = useState<Record<string, string>>({
    q1: initial.q1,
    q2: initial.q2,
  });
  const [text, setText] = useState<string>(initial.q3);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLogApi.deleteLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs", "monthly"] });
      if (logId) {
        queryClient.removeQueries({ queryKey: ["logs", "detail", logId] });
      }
      const next = new URLSearchParams(searchParams);
      next.delete("logId");
      next.delete("logid");
      next.delete("id");
      lastSyncedRef.current = null;
      navigate("/mylog", { replace: true });
    },
  });

  const answer1 = useMemo<Satisfaction | null>(() => {
    const v = (single.q1 ?? "").trim();
    if (!v) return null;
    if (v === "sat") return "GREAT";
    if (v === "so") return "SOSO";
    if (v === "unsat") return "BAD";
    return null;
  }, [single.q1]);

  const answer2 = useMemo<Achievement | null>(() => {
    const v = (single.q2 ?? "").trim();
    if (!v) return null;
    if (v === "all") return "PERFECT";
    if (v === "most") return "MOSTLY";
    if (v === "half") return "HALF";
    if (v === "few") return "SOMEWHAT";
    if (v === "none") return "DIFFERENT";
    return null;
  }, [single.q2]);

  const answer3 = useMemo(() => (text ?? "").trim(), [text]);

  const { isPosting } = useAutoCreateLog({
    answer1,
    answer2,
    answer3,
    debounceMs: 500,
    enabled: !logId,
    onSuccess: (createdLogId) => {
      queryClient.invalidateQueries({ queryKey: ["logs", "monthly"] });
      if (createdLogId) {
        queryClient.invalidateQueries({ queryKey: ["logs", "detail", createdLogId] });
      }

      if (!createdLogId) return;

      const next = new URLSearchParams(searchParams);
      next.set("logId", String(createdLogId));

      navigate({ pathname: "/mylog/survey", search: `?${next.toString()}` }, { replace: true });
    },
  });

  const { data: logDetail } = useLogDetail(logId ?? 0);

  const lastSyncedRef = useRef<{ a1: Satisfaction | null; a2: Achievement | null; a3: string } | null>(null);

  useEffect(() => {
    if (!logId) {
      lastSyncedRef.current = null;
      return;
    }
    if (!logDetail) return;

    lastSyncedRef.current = {
      a1: logDetail.answer1 ?? null,
      a2: logDetail.answer2 ?? null,
      a3: (logDetail.answer3 ?? "").trim(),
    };
  }, [logId, logDetail]);

  const isDirty = useMemo(() => {
    if (!logId) return false;
    if (!logDetail) return false;

    const base = lastSyncedRef.current ?? {
      a1: logDetail.answer1 ?? null,
      a2: logDetail.answer2 ?? null,
      a3: (logDetail.answer3 ?? "").trim(),
    };

    return base.a1 !== answer1 || base.a2 !== answer2 || base.a3 !== answer3;
  }, [logId, logDetail, answer1, answer2, answer3]);

  const [patchTrigger, setPatchTrigger] = useState(0);
  const bumpPatch = () => setPatchTrigger((v) => v + 1);

  const { isPatching } = useAutoUpdateLog({
    logId,
    answer1,
    answer2,
    answer3,
    trigger: patchTrigger,
    debounceMs: 500,
    enabled: Boolean(logId) && Boolean(logDetail) && isDirty,
    onSuccess: () => {
      lastSyncedRef.current = { a1: answer1, a2: answer2, a3: answer3 };
      queryClient.invalidateQueries({ queryKey: ["logs", "monthly"] });
      if (logId) {
        queryClient.invalidateQueries({ queryKey: ["logs", "detail", logId] });
      }
    },
  });

  const textPatchTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (textPatchTimerRef.current) window.clearTimeout(textPatchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!logDetail) return;

    const mapSatToChoice = (v: Satisfaction | null | undefined) => {
      if (v === "GREAT") return "sat";
      if (v === "SOSO") return "so";
      if (v === "BAD") return "unsat";
      return "";
    };

    const mapAchToChoice = (v: Achievement | null | undefined) => {
      if (v === "PERFECT") return "all";
      if (v === "MOSTLY") return "most";
      if (v === "HALF") return "half";
      if (v === "SOMEWHAT") return "few";
      if (v === "DIFFERENT") return "none";
      return "";
    };

    setSingle({
      q1: mapSatToChoice(logDetail.answer1),
      q2: mapAchToChoice(logDetail.answer2),
    });
    setText((logDetail.answer3 ?? "").slice(0, 100));
  }, [logDetail]);

  useEffect(() => {
    if (logId) return;
    setSingle({ q1: initial.q1, q2: initial.q2 });
    setText(initial.q3);
  }, [logId, initial.q1, initial.q2, initial.q3]);

  const onDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);

    if (!logId) {
      navigate(-1);
      return;
    }

    try {
      await deleteMutation.mutateAsync(logId);
    } catch {
    }
  };

  useEffect(() => {
    const handler = () => onDelete();
    window.addEventListener("survey:delete", handler as any);
    return () => window.removeEventListener("survey:delete", handler as any);
  }, [key]);

  const setChoice = (qid: string, cid: string) => {
    setSingle((prev) => {
      const next = { ...prev, [qid]: prev[qid] === cid ? "" : cid };
      return next;
    });

    if (logId) bumpPatch();
  };

  const onChangeText = (v: string, maxLen: number) => {
    setText(v.slice(0, maxLen));

    if (!logId) return;
    if (textPatchTimerRef.current) window.clearTimeout(textPatchTimerRef.current);
    textPatchTimerRef.current = window.setTimeout(() => {
      bumpPatch();
    }, 600);
  };

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ["logs", "monthly"] });
      if (logId) {
        queryClient.invalidateQueries({ queryKey: ["logs", "detail", logId] });
      }
    };
  }, [queryClient, logId]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="px-5 pt-2">
        <div className="mt-6 space-y-9.75 pb-10">
          {isPosting || isPatching || deleteMutation.isPending ? (
            <div className="text-[12px] text-grey-light-active">
              {deleteMutation.isPending ? "삭제 중…" : "자동 저장 중…"}
            </div>
          ) : null}
          {QUESTIONS.map((q, idx) => {
            if (q.type === "single") {
              return (
                <section key={q.id}>
                  <div className="text-[16px] font-medium text-grey-dark">{idx + 1}. {q.title}</div>
                  <div className="mt-3 space-y-1">
                    {q.choices.map((c) => {
                      const picked = single[q.id] === c.id;
                      const active = picked;

                      const base = "w-full rounded-[3px] border px-5 py-3.25 text-left text-[14px] font-medium";
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
                <div className="text-[16px] font-medium text-grey-dark">
                  {idx + 1}. {q.title}
                </div>
                <div className="mt-3">
                  <div className="min-h-23 w-full rounded-[10px] border border-grey-light bg-white px-5 py-3">
                    <div className="relative min-h-23 w-full">
                      <textarea
                        value={text}
                        onChange={(e) => onChangeText(e.target.value, q.maxLen)}
                        onBlur={() => {
                          if (!logId) return;
                          if (textPatchTimerRef.current) {
                            window.clearTimeout(textPatchTimerRef.current);
                            textPatchTimerRef.current = null;
                          }
                          bumpPatch();
                        }}
                        placeholder={q.placeholder}
                        maxLength={q.maxLen}
                        className="h-23 w-full resize-none text-[14px] text-grey-dark outline-none placeholder:text-grey-light-active"
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
