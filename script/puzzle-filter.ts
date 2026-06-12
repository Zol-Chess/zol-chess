import fs from "fs";
import { spawn } from "child_process";
import { Readable } from "stream";
import csv from "csv-parser";

const MIN_RATING = 800;
const MAX_RATING = 2800;
const BAND_SIZE = 40;
const levelCounts = new Map<number, number>();
const MAX_PUZZLES_PER_LEVEL = 500;

function clampRating(rating: number): number {
  return Math.max(MIN_RATING, Math.min(rating, MAX_RATING));
}

function getLevel(rating: number): number {
  const clamped = clampRating(rating);

  return Math.min(Math.floor((clamped - MIN_RATING) / BAND_SIZE) + 1, 50);
}

function isGoodPuzzle(row: any) {
  const themes = (row.Themes || "").split(" ");

  const allowed = new Set([
    "fork",
    "pin",
    "skewer",
    "mate",
    "sacrifice",
    "discoveredAttack",
  ]);

  const hasGoodTheme = themes.some((t: string) => allowed.has(t));

  const moveCount = row.Moves?.split(" ").length || 0;

  return hasGoodTheme && moveCount <= 10;
}

export function loadAndFilter(filePath: string): Promise<any[]> {
  return new Promise((resolve) => {
    const results: any[] = [];

    const source: Readable = filePath.endsWith(".zst")
      ? spawn("zstd", ["-d", filePath, "--stdout"]).stdout
      : fs.createReadStream(filePath);

    source
      .pipe(csv())
      .on("data", (row: Record<string, string>) => {
        if (!isGoodPuzzle(row)) return;

        const rating = Number(row.Rating);

        const ratingLevel = getLevel(rating);

        const currentCount = levelCounts.get(ratingLevel) ?? 0;

        // Skip if level already has 500 puzzles
        if (currentCount >= MAX_PUZZLES_PER_LEVEL) {
          return;
        }

        levelCounts.set(ratingLevel, currentCount + 1);

        results.push({
          puzzleId: row.PuzzleId,
          fen: row.FEN,
          moves: row.Moves.split(" "),
          rating,
          ratingLevel,
          themes: row.Themes.split(" "),
        });
      })
      .on("end", () => {
        console.log(`Filtered puzzles: ${results.length}`);

        // Sort by rating for progression assignment
        const sorted = results.sort((a, b) => a.rating - b.rating);

        const chunkSize = Math.ceil(sorted.length / 50);

        const puzzlesWithLevels = sorted.map((puzzle, index) => ({
          ...puzzle,
          progressionLevel: Math.min(Math.floor(index / chunkSize) + 1, 50),
        }));

        resolve(puzzlesWithLevels);
      });
  });
}
