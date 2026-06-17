export interface Puzzle {
  id?: string;
  puzzleId: string;
  fen: string;
  moves: string[];
  rating: number;
  ratingLevel: number;
  progressionLevel: number;
  themes: string[];
  solutionSignature?: string | null;
}

export type PuzzleResponse = {
  id: string;
  puzzleId: string;
  fen: string;
  encryptedSolution: { iv: string; data: string } | null;
  solutionKey: string | null;
  solutionSignature: string | null;
  rating: number;
  ratingLevel: number;
  progressionLevel: number;
  themes: string[];
};
