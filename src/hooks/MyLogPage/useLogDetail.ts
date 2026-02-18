import { useQuery } from "@tanstack/react-query";
import { logDetailApi } from "@/apis/MyLogPage/logDetail";

export const useLogDetail = (logId: number | null) => {
  return useQuery({
    queryKey: ["logs", "detail", logId],
    queryFn: () => {
      if (!logId) throw new Error("logId is required");
      return logDetailApi.getLogDetail(logId);
    },
    enabled: Boolean(logId),
    staleTime: 30_000,
  });
};