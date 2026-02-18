import { api } from "@/apis/api";

export const logoutApi = {
  async logout() {
    await api.post("/api/auth/logout");
  },
};