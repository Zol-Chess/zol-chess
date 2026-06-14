export type PuzzleTheme =
  | "mateInOne"
  | "mateInTwo"
  | "fork"
  | "pin"
  | "skewer"
  | "deflection"
  | "endgame";

export interface Puzzle {
  id: string;
  fen: string;          // starting position
  solution: string[];   // correct moves in UCI notation e.g. ["e2e4", "d7d5"]
  theme: PuzzleTheme;
  difficulty: number;   // 0–2000 Lichess-style rating
  wagerLamports: number; // on-chain prize for solving (0 = free)
}

// Per-user puzzle session (stored in memory or a DB later)
export interface PuzzleSession {
  puzzleId: string;
  walletAddress: string;
  stepIndex: number;    // which solution move we expect next
  solved: boolean;
  failed: boolean;
  startedAt: number;
}

export type AttemptResult =
  | { outcome: "correct"; nextFen: string; stepIndex: number; solved: boolean }
  | { outcome: "wrong"; hint?: string }
  | { outcome: "already_done" };

// Validate one player move against the expected solution step.
// Returns the updated session + result the API can send back.
export function validateMove(
  _puzzle: Puzzle,
  _session: PuzzleSession,
  _uciMove: string, // e.g. "e2e4"
): AttemptResult {
  // TODO:
  // 1. If session.solved || session.failed → return "already_done"
  // 2. If _uciMove !== puzzle.solution[session.stepIndex] → mark failed, return "wrong"
  // 3. Apply the player move + the next solution move (engine response) to get nextFen
  // 4. Advance stepIndex by 2 (player move + engine response)
  // 5. If stepIndex >= solution.length → mark solved, return { outcome:"correct", solved:true }
  throw new Error("Not implemented");
}
