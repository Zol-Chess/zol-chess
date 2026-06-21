import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STORED_KEYS } from "@/constants/store";
import ChessStorage from "@/utils/storage";

import { AuthState, WALLET_STATUS } from "./auth.types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      walletStatus: WALLET_STATUS.DISCONNECTED,
      setWalletSession(details) {
        return set({ ...details });
      },
      setUser(user) {
        return set({ user });
      },
      updateUser(user) {
        return set((state) => {
          const nextUser = {
            ...state.user,
            ...user,
          };

          if (JSON.stringify(nextUser) === JSON.stringify(state.user)) {
            return state;
          }

          return { user: nextUser };
        });
      },
    }),
    {
      name: STORED_KEYS.auth,
      storage: createJSONStorage(() => new ChessStorage()),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
