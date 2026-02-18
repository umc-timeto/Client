import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Achievement, CreateLogRequest, CreateLogResponse, Satisfaction } from "@/apis/MyLogPage/logs";
import { logsApi } from "@/apis/MyLogPage/logs";

type UseAutoCreateLogArgs = {
  answer1?: Satisfaction | null;
  answer2?: Achievement | null;
  answer3?: string | null;
  debounceMs?: number;
  enabled?: boolean;
  onSuccess?: (logId: number | null) => void;
  onError?: (e: unknown) => void;
};

export function useAutoCreateLog({
  answer1,
  answer2,
  answer3,
  debounceMs = 500,
  enabled = true,
  onSuccess,
  onError,
}: UseAutoCreateLogArgs) {
  const timerRef = useRef<number | null>(null);
  const lastSentKeyRef = useRef<string>("");

  const canSend = Boolean(answer1 && answer2 && (answer3 ?? "").trim().length > 0);

  const body: CreateLogRequest | null = useMemo(() => {
    if (!canSend) return null;
    return {
      answer1: answer1 as Satisfaction,
      answer2: answer2 as Achievement,
      answer3: (answer3 ?? "").trim(),
    };
  }, [answer1, answer2, answer3, canSend]);

  const mutation = useMutation<CreateLogResponse, unknown, CreateLogRequest>({
    mutationFn: (req: CreateLogRequest) => logsApi.createLog(req),
    onSuccess: (payload) => {
      const candidate =
        (payload as any)?.data?.logId ??
        (payload as any)?.data?.id ??
        (payload as any)?.logId ??
        (payload as any)?.id ??
        null;

      const logId =
        typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0
          ? candidate
          : null;

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