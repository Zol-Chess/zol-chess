import type { Color, GameStatus, Move } from "./types";

export interface MoveResult {
  success: boolean;
  san: string;
  fen: string;
  status: GameStatus;
  winner: Color | null;
  error?: string;
}

export class ChessEngine {
  constructor(_fen?: string) {
    // TODO: new Chess(fen)
  }

  move(_move: Move): MoveResult {
    // TODO: validate + apply move, derive status/winner
    throw new Error("Not implemented");
  }

  fen(): string {
    throw new Error("Not implemented");
  }

  turn(): Color {
    throw new Error("Not implemented");
  }
}
