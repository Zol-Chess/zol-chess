import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STORED_KEYS } from "@/constants/store";
import ChessStorage from "@/utils/storage";

export const useBoundStore = create()(
  persist((set) => ({}), {
    name: STORED_KEYS.app,
    storage: createJSONStorage(() => new ChessStorage()),
  })
);
