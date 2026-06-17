import { create } from "zustand";

import { PuzzleState } from "./puzzle.types";

export const usePuzzleStore = create<PuzzleState>()((set) => ({
  encryptedPuzzles: [],
  updatePuzzleList(puzzles) {
    set({ encryptedPuzzles: puzzles });
  },
}));
