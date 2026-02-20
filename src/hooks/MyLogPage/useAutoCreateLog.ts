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
  onMutate?: () => void;
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
  onMutate,
  onError,
}: UseAutoCreateLogArgs) {
  const timerRef = useRef<number | null>(null);
  const lastSentKeyRef = useRef<string>("");

  // Q1 또는 Q2 중 하나라도 선택되면 생성 가능 (answer3는 null/empty 허용)
  const canSend = Boolean(answer1 !== null || answer2 !== null);

  const body: CreateLogRequest | null = useMemo(() => {
    if (!canSend) return null;
    return {
      answer1: (answer1 ?? null) as any,
      answer2: (answer2 ?? null) as any,
      answer3: (answer3 ?? null) as any,
      date: date as string,
    };
  }, [answer1, answer2, answer3, date, canSend]);

  const mutation = useMutation<CreateLogResponse, unknown, CreateLogRequest>({
    mutationFn: (req: CreateLogRequest) => logsApi.createLog(req),
    onSuccess: (payload) => {
      console.log("[useAutoCreateLog] createLog payload", payload);

      const p: any = payload as any;

      // payload 자체에 바로 id가 오는 경우
      const direct = p?.logId ?? p?.id;

      // data가 number로 오는 경우 (예: data: 9)
      const dataAsNumber = typeof p?.data === "number" ? p.data : null;

      // data가 object로 오는 경우
      const dataObj = p?.data && typeof p.data === "object" ? p.data : null;
      const nested = dataObj?.logId ?? dataObj?.id ?? dataObj?.logDetailId;

      const candidate =
        typeof direct === "number"
          ? direct
          : typeof dataAsNumber === "number"
          ? dataAsNumber
          : typeof nested === "number"
          ? nested
          : null;

      const logId =
        typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0 ? candidate : null;

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

      // First POST가 실제로 나가는 순간부터는 추가 POST가 다시 예약되지 않도록 잠금
      onMutate?.();

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