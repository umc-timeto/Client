import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/apis/api";
import type { Satisfaction, Achievement } from "@/apis/MyLogPage/logs";

type UpdateLogRequest = {
  answer1: Satisfaction;
  answer2: Achievement;
  answer3: string;
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
  answer3: string;
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
    if (!answer3.trim()) return false;
    return true;
  }, [enabled, logId, answer1, answer2, answer3]);

  const latestRef = useRef({
    answer1: answer1 as Satisfaction | null,
    answer2: answer2 as Achievement | null,
    answer3: answer3,
  });

  useEffect(() => {
    latestRef.current = { answer1, answer2, answer3 };
  }, [answer1, answer2, answer3]);

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

      mutation.mutate({
        answer1: cur.answer1,
        answer2: cur.answer2,
        answer3: cur.answer3.trim(),
      });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [canSend, trigger, debounceMs, mutation]);

  return {
    isPatching: mutation.isPending,
    error: mutation.error,
  };
}