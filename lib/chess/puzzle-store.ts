import type { Puzzle } from "./puzzle";

// Seed data — replace with DB or Lichess puzzle CSV import later
const PUZZLES: Puzzle[] = [
  {
    id: "puzzle_001",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["f3g5", "d8f6", "g5f7"], // Fried Liver mate-in-3 motif
    theme: "mateInTwo",
    difficulty: 1200,
    wagerLamports: 0,
  },
];

// In-memory puzzle sessions keyed by `${walletAddress}:${puzzleId}`
// TODO: replace with a real DB (e.g. Postgres via Prisma)
import type { PuzzleSession } from "./puzzle";
const sessions = new Map<string, PuzzleSession>();

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function getRandomPuzzle(theme?: string): Puzzle {
  const pool = theme ? PUZZLES.filter((p) => p.theme === theme) : PUZZLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getOrCreateSession(walletAddress: string, puzzleId: string): PuzzleSession {
  const key = `${walletAddress}:${puzzleId}`;
  if (!sessions.has(key)) {
    sessions.set(key, {
      puzzleId,
      walletAddress,
      stepIndex: 0,
      solved: false,
      failed: false,
      startedAt: Date.now(),
    });
  }
  return sessions.get(key)!;
}

export function saveSession(session: PuzzleSession): void {
  sessions.set(`${session.walletAddress}:${session.puzzleId}`, session);
}
