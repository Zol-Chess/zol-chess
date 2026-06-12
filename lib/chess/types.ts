export type Color = "w" | "b";
export type GameStatus =
  | "active"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resigned"
  | "abandoned";

export interface Player {
  walletAddress: string;
  socketId: string;
  color: Color;
  timeRemainingMs: number;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

export interface MoveRecord {
  move: Move;
  san: string;
  fen: string;
  timestamp: number;
  playerWallet: string;
}

export interface GameState {
  id: string;
  players: { w: Player; b: Player };
  fen: string;
  turn: Color;
  status: GameStatus;
  moves: MoveRecord[];
  winner: Color | null;
  createdAt: number;
  lastMoveAt: number;
  wagerLamports: number;
}

export interface QueueEntry {
  walletAddress: string;
  socketId: string;
  joinedAt: number;
  wagerLamports: number;
}
