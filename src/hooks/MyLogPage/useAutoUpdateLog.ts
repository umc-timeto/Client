import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/apis/api";
import type { Satisfaction, Achievement } from "@/apis/MyLogPage/logs";

type UpdateLogRequest = {
  answer1: Satisfaction;
  answer2: Achievement;
  answer3: string | null;
  date: string;
};

type UpdateLogResponse = {
  status: number;
  code: string;
  message: string;
  data?: unknown;
};

type Params = {
  logId: number | null;
  answer1: Satisfaction | null;
  answer2: Achievement | null;
  answer3?: string | null;
  date?: string;
  debounceMs?: number;
  enabled?: boolean;
  trigger?: number;
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
};

export function useAutoUpdateLog({
  logId,
  answer1,
  answer2,
  answer3,
  date,
  debounceMs = 500,
  enabled = true,
  trigger,
  onSuccess,
  onError,
}: Params) {
  const canSend = useMemo(() => {
    if (!enabled) return false;
    if (!logId) return false;
    if (!answer1 || !answer2) return false;
    return true;
  }, [enabled, logId, answer1, answer2]);

  const latestRef = useRef({
    answer1: answer1 as Satisfaction | null,
    answer2: answer2 as Achievement | null,
    answer3: answer3,
    date: date as string,
  });

  useEffect(() => {
    latestRef.current = { answer1, answer2, answer3, date: date as string };
  }, [answer1, answer2, answer3, date]);

  const lastTriggerRef = useRef<number | null>(null);

  const mutation = useMutation<UpdateLogResponse, unknown, UpdateLogRequest>({
    mutationFn: async (req) => {
      const res = await api.patch<UpdateLogResponse>(`/api/logs/${logId}`, req, {
        headers: { "Content-Type": "application/json" },
      });
      const payload = res.data;
      if (payload?.status !== 200) {
        throw new Error(payload?.message || "일지 수정에 실패했습니다.");
      }
      return payload;
    },
    onSuccess: () => onSuccess?.(),
    onError: (e) => onError?.(e),
  });

  useEffect(() => {
    if (!canSend) return;

    if (typeof trigger !== "number") return;

    if (lastTriggerRef.current === trigger) return;
    lastTriggerRef.current = trigger;

    const timer = window.setTimeout(() => {
      const cur = latestRef.current;
      if (!cur.answer1 || !cur.answer2) return;
      if (!cur.date) return;

      const trimmed = (cur.answer3 ?? "").trim();

      mutation.mutate({
        answer1: cur.answer1,
        answer2: cur.answer2,
        answer3: trimmed.length > 0 ? trimmed : null,
        date: cur.date,
      });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [canSend, trigger, debounceMs, mutation]);

  return {
    isPatching: mutation.isPending,
    error: mutation.error,
  };
}