import type { QueueEntry } from "./types";

class Matchmaking {
  private queue: QueueEntry[] = [];

  // Returns the matched opponent if one exists, otherwise queues the entry
  join(_entry: QueueEntry): QueueEntry | null {
    // TODO: find entry with same wagerLamports, remove + return it; else push
    throw new Error("Not implemented");
  }

  leave(socketId: string): void {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }
}

export const matchmaking = new Matchmaking();
