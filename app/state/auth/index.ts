import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STORED_KEYS } from "@/constants/store";
import ChessStorage from "@/utils/storage";

import { AuthState } from "./auth.types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setWalletSession(details) {
        return set({ ...details });
      },
    }),
    {
      name: STORED_KEYS.auth,
      storage: createJSONStorage(() => new ChessStorage()),
    }
  )
);
