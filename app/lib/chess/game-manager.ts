import type { GameState, Move } from "./types";

// Singleton in-memory store — survives across requests in custom server mode
class GameManager {
  private games = new Map<string, GameState>();

  create(_whiteWallet: string, _blackWallet: string, _wagerLamports: number): GameState {
    // TODO: generate id, init ChessEngine, build GameState
    throw new Error("Not implemented");
  }

  makeMove(_gameId: string, _walletAddress: string, _move: Move): GameState {
    // TODO: validate turn ownership, call engine.move(), persist
    throw new Error("Not implemented");
  }

  resign(_gameId: string, _walletAddress: string): GameState {
    // TODO: set status "resigned", set winner to opponent
    throw new Error("Not implemented");
  }

  get(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }
}

export const gameManager = new GameManager();
