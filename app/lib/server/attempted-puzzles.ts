import { address, type ReadonlyUint8Array } from "@solana/kit";

import { fetchMaybePuzzleHistory } from "@/generated/zol_chess_program/accounts";
import { findPuzzleHistoryPda } from "@/generated/zol_chess_program/pdas";
import {
  createSolanaClient,
  CLUSTERS,
  type ClusterMoniker,
} from "@/lib/solana-client";

function decodeRecentPuzzleIds(history: {
  count: number;
  recentIndex: number;
  recentRecords: ReadonlyUint8Array[];
}): string[] {
  const decoder = new TextDecoder();
  const count = Math.min(history.count, history.recentRecords.length);

  return Array.from({ length: count }, (_, offset) => {
    const index =
      (history.recentIndex - 1 - offset + history.recentRecords.length) %
      history.recentRecords.length;
    const record = history.recentRecords[index]!;
    return decoder.decode(record.slice(0, 5)).replace(/\0/g, "");
  });
}

// Puzzle ids the player has already attempted or solved, sourced from the
// on-chain PuzzleHistory ring buffer (last 50 records). Returns an empty
// list if the player has no wallet/history yet, or the RPC lookup fails.
export async function getAttemptedPuzzleIds(
  playerPubkey: string,
  clusterParam?: string | null
): Promise<string[]> {
  if (!playerPubkey) return [];

  const cluster = (CLUSTERS as readonly string[]).includes(clusterParam ?? "")
    ? (clusterParam as ClusterMoniker)
    : "devnet";

  try {
    const client = createSolanaClient(cluster);
    const [puzzleHistoryPda] = await findPuzzleHistoryPda({
      authority: address(playerPubkey),
    });
    const history = await fetchMaybePuzzleHistory(
      client.rpc,
      puzzleHistoryPda
    );
    return history.exists ? decodeRecentPuzzleIds(history.data) : [];
  } catch {
    return [];
  }
}
