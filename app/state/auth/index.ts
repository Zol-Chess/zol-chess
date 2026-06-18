import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STORED_KEYS } from "@/constants/store";
import ChessStorage from "@/utils/storage";

import { AuthState } from "./auth.types";

export const useAuthStore = create<AuthState>()((set) => ({
  setWalletSession(details) {
    return set({ ...details });
  },
  setUser(user) {
    return set({ user });
  },
  updateUser(user) {
    return set((state) => ({ user: { ...state.user, ...user } }));
  },
}));
