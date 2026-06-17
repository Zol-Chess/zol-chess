"use client";

import { useEffect, useState } from "react";

import { usePuzzles } from "@/hooks/query/use-puzzles";
import { decryptSolution } from "@/script/encrypt-solution";
import { Puzzle } from "@/services/puzzle.ts/puzzle.types";

import MainPlay from "./main-play";

const PuzzlesWrapper = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const { data: puzzles, isLoading } = usePuzzles();

  useEffect(() => {
    if (!puzzles?.length) return;
    const puzzleSet = puzzles[0];
    if (!puzzleSet.encryptedSolution || !puzzleSet.solutionKey) return;

    decryptSolution(puzzleSet.encryptedSolution, puzzleSet.solutionKey).then(
      (moves) => {
        if (!moves) return;
        setPuzzle({ ...puzzleSet, moves });
      }
    );
  }, [puzzles]);

  return <MainPlay puzzle={puzzle} isLoading={isLoading} />;
};

export default PuzzlesWrapper;
