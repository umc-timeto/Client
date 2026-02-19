import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Achievement, CreateLogRequest, CreateLogResponse, Satisfaction } from "@/apis/MyLogPage/logs";
import { logsApi } from "@/apis/MyLogPage/logs";

type UseAutoCreateLogArgs = {
  answer1?: Satisfaction | null;
  answer2?: Achievement | null;
  answer3?: string | null;
  date?: string;
  debounceMs?: number;
  enabled?: boolean;
  onSuccess?: (logId: number | null) => void;
  onError?: (e: unknown) => void;
};

export function useAutoCreateLog({
  answer1,
  answer2,
  answer3,
  date,
  debounceMs = 500,
  enabled = true,
  onSuccess,
  onError,
}: UseAutoCreateLogArgs) {
  const timerRef = useRef<number | null>(null);
  const lastSentKeyRef = useRef<string>("");

  const canSend = Boolean(answer1 && answer2);

  const body: CreateLogRequest | null = useMemo(() => {
    if (!canSend) return null;
    return {
      answer1: answer1 as Satisfaction,
      answer2: answer2 as Achievement,
      answer3: (answer3 ?? "").trim(),
      date: date as string,
    };
  }, [answer1, answer2, answer3, date, canSend]);

  const mutation = useMutation<CreateLogResponse, unknown, CreateLogRequest>({
    mutationFn: (req: CreateLogRequest) => logsApi.createLog(req),
    onSuccess: (payload) => {
      console.log("[useAutoCreateLog] createLog payload", payload);

      const directId = (payload as any)?.logId;
      const nestedId = (payload as any)?.data?.logId;
      const nestedIdAlt = (payload as any)?.data?.id;

      const candidate =
        typeof directId === "number"
          ? directId
          : typeof nestedId === "number"
          ? nestedId
          : typeof nestedIdAlt === "number"
          ? nestedIdAlt
          : null;

      const logId =
        typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0
          ? candidate
          : null;

      console.log("[useAutoCreateLog] extracted logId", logId);

      onSuccess?.(logId);
    },
    onError: (e) => onError?.(e),
  });

  useEffect(() => {
    if (!enabled) return;
    if (!body) return;

    const key = JSON.stringify(body);

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      if (lastSentKeyRef.current === key) return;

      if (mutation.isPending) return;

      lastSentKeyRef.current = key;
      mutation.mutate(body);
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [body, debounceMs, enabled, mutation]);

  return {
    isPosting: mutation.isPending,
    error: mutation.error,
  };
}