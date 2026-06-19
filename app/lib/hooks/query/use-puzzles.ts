import useSWR from "swr";

import { getRandomPuzzles, getPuzzleById } from "@/services/puzzle.ts";
import { useAuthStore } from "@/state/auth";

export function usePuzzles() {
  const rating = useAuthStore((s) => s.user?.puzzle_rating ?? 450);
  const playerPubkey = useAuthStore((s) => s.walletAddress ?? "");

  return useSWR(
    playerPubkey ? ["puzzles", rating, playerPubkey] : null,
    ([, r, pk]) => getRandomPuzzles(r, 10, pk),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
}

export function usePuzzleById(id: string | null) {
  const playerPubkey = useAuthStore((s) => s.walletAddress ?? "");

  return useSWR(
    id && playerPubkey ? ["puzzle", id, playerPubkey] : null,
    ([, i, pk]) => getPuzzleById(i, pk),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
}
