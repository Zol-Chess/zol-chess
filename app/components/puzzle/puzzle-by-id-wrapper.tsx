"use client";

import { useEffect, useState } from "react";

import { decryptSolution } from "@/script/encrypt-solution";
import { getPuzzleById } from "@/services/puzzle.ts";
import { Puzzle } from "@/services/puzzle.ts/puzzle.types";
import { showToast } from "@/lib/toast";
import { catchErr } from "@/utils/error-handlers";

import MainPlay from "./main-play";

interface PuzzleByIdWrapperProps {
  id: string;
}

const PuzzleByIdWrapper = ({ id }: PuzzleByIdWrapperProps) => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setPuzzle(null);

    getPuzzleById(id)
      .then(async (puzzleResponse) => {
        if (!puzzleResponse.encryptedSolution || !puzzleResponse.solutionKey) {
          showToast("Puzzle solution unavailable.", "error");
          return;
        }

        const moves = await decryptSolution(
          puzzleResponse.encryptedSolution,
          puzzleResponse.solutionKey
        );

        if (!moves) {
          showToast("Failed to decrypt puzzle solution.", "error");
          return;
        }

        setPuzzle({ ...puzzleResponse, moves });
      })
      .catch((error) => {
        showToast(catchErr(error).message ?? "Failed to load puzzle.", "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  return <MainPlay puzzle={puzzle} isLoading={isLoading} />;
};

export default PuzzleByIdWrapper;
