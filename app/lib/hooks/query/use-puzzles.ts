import useSWR from "swr";

import { getRandomPuzzles, getPuzzleById } from "@/services/puzzle.ts";
import { useAuthStore } from "@/state/auth";
import { useCluster } from "@/components/cluster-context";

export function usePuzzles() {
  const rating = useAuthStore((s) => s.user?.player_rating ?? 450);
  const playerPubkey = useAuthStore((s) => s.walletAddress ?? "");
  const { cluster } = useCluster();

  return useSWR(
    playerPubkey ? ["puzzles", rating, playerPubkey, cluster] : null,
    ([, r, pk, c]) => getRandomPuzzles(r, 5, pk, c),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
}

export function usePuzzleById(id: string | null) {
  const playerPubkey = useAuthStore((s) => s.walletAddress ?? "");
  const { cluster } = useCluster();

  return useSWR(
    id && playerPubkey ? ["puzzle", id, playerPubkey, cluster] : null,
    ([, i, pk, c]) => getPuzzleById(i, pk, c),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
}
