"use client";

import useSWR from "swr";

import { usePuzzles } from "@/lib/hooks/query/use-puzzles";
import { Puzzle } from "@/services/puzzle.ts/puzzle.types";
import { useWalletValues } from "@/lib/wallet/context";
import { decryptSolution } from "@/script/decrypt-solution";
import { showToast } from "@/lib/toast";
import { catchErr } from "@/utils/error-handlers";

import MainPlay from "./main-play";

const PuzzlesWrapper = () => {
  const { data: puzzles, isLoading: puzzlesLoading } = usePuzzles();
  const { signer } = useWalletValues();
  const firstPuzzle = puzzles?.[0];

  const { data: puzzle, isLoading: decrypting } = useSWR<Puzzle | null>(
    firstPuzzle
      ? ["decrypted-puzzle", firstPuzzle.puzzleId, firstPuzzle.solutionKey]
      : null,
    async () => {
      try {
        if (!firstPuzzle?.encryptedSolution || !firstPuzzle.solutionKey) {
          showToast("Puzzle solution unavailable.", "error");
          return null;
        }

        const moves = await decryptSolution(
          firstPuzzle.encryptedSolution,
          firstPuzzle.solutionKey
        );
        if (!moves) {
          showToast("Failed to decrypt puzzle solution.", "error");
          return null;
        }

        return { ...firstPuzzle, moves };
      } catch (error) {
        showToast(
          catchErr(error).message ?? "Failed to decrypt puzzle.",
          "error"
        );
        return null;
      }
    }
  );

  return (
    <MainPlay
      key={
        puzzle
          ? `${puzzle.puzzleId}:${puzzle.id ?? "initial"}`
          : "initial-puzzle-loading"
      }
      signer={signer}
      puzzle={puzzle ?? null}
      isLoading={puzzlesLoading || decrypting}
    />
  );
};

export default PuzzlesWrapper;
