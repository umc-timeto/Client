import { create } from "zustand";

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;

  hydrate: () => void;
  loginMock: (payload: { user: AuthUser; accessToken: string }) => void;
  logout: () => void;
};

const STORAGE_KEY = "timetto_auth_v1";

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,

  hydrate: () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        user: AuthUser;
        accessToken: string;
      };
      set({
        isAuthenticated: true,
        user: parsed.user,
        accessToken: parsed.accessToken,
      });
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },

  loginMock: ({ user, accessToken }) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }));
    set({ isAuthenticated: true, user, accessToken });
  },

  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    set({ isAuthenticated: false, user: null, accessToken: null });
  },
}));