import useSWR from "swr";

import { getRandomPuzzles, getPuzzleById } from "@/services/puzzle.ts";
import { useAuthStore } from "@/state/auth";

export function usePuzzles() {
  const rating = useAuthStore((s) => s.user?.puzzle_rating ?? 450);

  return useSWR(["puzzles", rating], ([, r]) => getRandomPuzzles(r), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
}

export function usePuzzleById(id: string | null) {
  return useSWR(id ? ["puzzle", id] : null, ([, i]) => getPuzzleById(i), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
}
