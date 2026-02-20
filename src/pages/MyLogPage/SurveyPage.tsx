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

  const [currentLogId, setCurrentLogId] = useState<number | null>(logId);

  useEffect(() => {
    if (logId) {
      setCurrentLogId(logId);
    }
  }, [logId]);

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

  const lastSyncedRef = useRef<{ a1: Satisfaction | null; a2: Achievement | null; a3: string } | null>(null);
  const textPatchTimerRef = useRef<number | null>(null);
  const suppressPatchRef = useRef(false);
  const suppressAutoCreateRef = useRef(false);
  const createdLogIdRef = useRef<number | null>(null);

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
      createdLogIdRef.current = null;
      setCurrentLogId(null);
      suppressAutoCreateRef.current = true;
      setSingle({ q1: "", q2: "" });
      setText("");
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

  const answer3 = useMemo<string | null>(() => {
    const v = (text ?? "").trim();
    return v.length > 0 ? v : null;
  }, [text]);

  const dateStr = useMemo(() => toYmd(date), [date]);

  const detailQueryId = (currentLogId ?? logId) ?? 0;
  const { data: logDetail } = useLogDetail(detailQueryId);

  const effectiveLogId = useMemo(() => {
    const fromDetail = typeof logDetail?.logId === "number" ? logDetail.logId : null;
    return fromDetail ?? currentLogId ?? logId ?? createdLogIdRef.current;
  }, [logDetail, currentLogId, logId]);

  const { isPosting } = useAutoCreateLog({
    answer1,
    answer2,
    answer3,
    date: dateStr,
    debounceMs: 500,
    enabled:
      !confirmOpen &&
      !deleteMutation.isPending &&
      !suppressAutoCreateRef.current &&
      !effectiveLogId &&
      (answer1 !== null || answer2 !== null),
    onMutate: () => {
      // POST가 실제로 나가는 순간부터는 URL에 logId가 붙기 전이라도
      // 같은 화면에서 추가 POST가 재발사되지 않도록 즉시 잠금
      suppressAutoCreateRef.current = true;
    },
    onSuccess: (createdLogId) => {
      suppressAutoCreateRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["logs", "monthly"] });
      if (createdLogId) {
        queryClient.invalidateQueries({ queryKey: ["logs", "detail", createdLogId] });
      }

      if (!createdLogId) return;

      const next = new URLSearchParams(searchParams);
      next.set("logId", String(createdLogId));

      suppressAutoCreateRef.current = true;
      createdLogIdRef.current = createdLogId;
      setCurrentLogId(createdLogId);

      navigate({ pathname: "/mylog/survey", search: `?${next.toString()}` }, { replace: true });
    },
  });

useEffect(() => {
  if (!logDetail) return;

  
  if (!currentLogId && typeof logDetail.logId === "number") {
    setCurrentLogId(logDetail.logId);
  }

  lastSyncedRef.current = {
    a1: logDetail.answer1 ?? null,
    a2: logDetail.answer2 ?? null,
    a3: (logDetail.answer3 ?? "").trim(),
  };
}, [logDetail, currentLogId]);

  const isDirty = useMemo(() => {
    if (!logId) return false;
    if (!logDetail) return false;

    const base = lastSyncedRef.current ?? {
      a1: logDetail.answer1 ?? null,
      a2: logDetail.answer2 ?? null,
      a3: (logDetail.answer3 ?? "").trim(),
    };

    return base.a1 !== answer1 || base.a2 !== answer2 || base.a3 !== (answer3 ?? "");
  }, [logId, logDetail, answer1, answer2, answer3]);

  const [patchTrigger, setPatchTrigger] = useState(0);
  const bumpPatch = () => setPatchTrigger((v) => v + 1);

  const { isPatching } = useAutoUpdateLog({
    logId: effectiveLogId,
    answer1,
    answer2,
    answer3,
    date: dateStr,
    trigger: patchTrigger,
    debounceMs: 500,
    enabled:
      !confirmOpen &&
      !deleteMutation.isPending &&
      !suppressPatchRef.current &&
      Boolean(effectiveLogId) &&
      Boolean(logDetail) &&
      (answer1 !== null || answer2 !== null || answer3 !== null) &&
      isDirty,
    onSuccess: () => {
      lastSyncedRef.current = { a1: answer1, a2: answer2, a3: answer3 ?? "" };
      queryClient.invalidateQueries({ queryKey: ["logs", "monthly"] });
      if (effectiveLogId) {
        queryClient.invalidateQueries({ queryKey: ["logs", "detail", effectiveLogId] });
      }
    },
  });

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
    suppressPatchRef.current = false;
    setSingle({ q1: initial.q1, q2: initial.q2 });
    setText(initial.q3);
  }, [logId, initial.q1, initial.q2, initial.q3]);

  const onDelete = () => {
    suppressPatchRef.current = true;
    suppressAutoCreateRef.current = true;
    if (textPatchTimerRef.current) {
      window.clearTimeout(textPatchTimerRef.current);
      textPatchTimerRef.current = null;
    }
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    suppressPatchRef.current = true;
    suppressAutoCreateRef.current = true;
    if (textPatchTimerRef.current) {
      window.clearTimeout(textPatchTimerRef.current);
      textPatchTimerRef.current = null;
    }

    const effectiveLogId =
      (typeof logDetail?.logId === "number" ? logDetail.logId : null) ??
      currentLogId ??
      logId ??
      createdLogIdRef.current;

    console.log("[SurveyPage] delete attempt", {
      queryLogId: logId,
      currentLogId,
      createdLogIdRef: createdLogIdRef.current,
      detailLogId: logDetail?.logId,
      effectiveLogId,
    });

    if (!effectiveLogId) {
    
      return;
    }

    try {
      await deleteMutation.mutateAsync(effectiveLogId);
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

    // NOTE: POST 직후에는 아직 URL의 logId가 없을 수 있으므로,
    // logId(query) 대신 effectiveLogId/currentLogId/createdLogIdRef 기준으로 분기해야 합니다.
    const hasAnyLogId = Boolean(effectiveLogId ?? currentLogId ?? createdLogIdRef.current);

    if (hasAnyLogId && !suppressPatchRef.current) bumpPatch();

    // 아직 어떤 logId도 없을 때만 auto-create를 다시 허용
    if (!hasAnyLogId) suppressAutoCreateRef.current = false;
  };

  const onChangeText = (v: string, maxLen: number) => {
    setText(v.slice(0, maxLen));
    const hasAnyLogId = Boolean(effectiveLogId ?? currentLogId ?? createdLogIdRef.current);

    if (!hasAnyLogId) suppressAutoCreateRef.current = false;

    if (!hasAnyLogId) return;
    if (textPatchTimerRef.current) window.clearTimeout(textPatchTimerRef.current);
    textPatchTimerRef.current = window.setTimeout(() => {
      if (suppressPatchRef.current) return;
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
                          const hasAnyLogId = Boolean(effectiveLogId ?? currentLogId ?? createdLogIdRef.current);
                          if (!hasAnyLogId) return;
                          if (textPatchTimerRef.current) {
                            window.clearTimeout(textPatchTimerRef.current);
                            textPatchTimerRef.current = null;
                          }
                          if (suppressPatchRef.current) return;
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
        variant="danger"
        onCancel={() => {
          suppressPatchRef.current = false;
          suppressAutoCreateRef.current = false;
          setConfirmOpen(false);
        }}
        onConfirm={handleConfirmDelete}
      />

      <div className="pb-4" />
    </div>
  );
}
