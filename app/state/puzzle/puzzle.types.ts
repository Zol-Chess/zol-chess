import { PuzzleResponse } from "@/services/puzzle.ts/puzzle.types";

export type PuzzleState = {
  encryptedPuzzles: PuzzleResponse[];
  error?: string;
  updatePuzzleList: (puzzles: PuzzleResponse[]) => void;
};
