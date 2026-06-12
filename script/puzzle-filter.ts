import fs from "fs";
import csv from "csv-parser";

function getLevel(rating: number): number {
  const MIN_RATING = 800;
  const MAX_RATING = 2800;
  const BAND_SIZE = 40;

  const clamped = Math.max(MIN_RATING, Math.min(rating, MAX_RATING));

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

  return hasGoodTheme && moveCount <= 10; // avoid messy long puzzles
}

export function loadAndFilter(filePath: string): Promise<any[]> {
  return new Promise((resolve) => {
    const results: Record<string, string | number | string[]>[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: Record<string, string>) => {
        if (!isGoodPuzzle(row)) return;

        const rating = Number(row.Rating);

        results.push({
          puzzleId: row.PuzzleId,
          fen: row.FEN,
          moves: row.Moves.split(" "),
          rating,
          ratingLevel: getLevel(rating),
          themes: row.Themes.split(" "),
        });
      })
      .on("end", () => {
        console.log(`Filtered puzzles: ${results.length}`);
        const sorted = results.sort((a, b) =>
          typeof a.rating === "number" && typeof b.rating === "number"
            ? a.rating - b.rating
            : 1
        );

        const chunkSize = Math.ceil(sorted.length / 50);

        const puzzlesWithLevels = sorted.map((puzzle, index) => {
          const assignedLevel = Math.min(Math.floor(index / chunkSize) + 1, 50);

          return {
            ...puzzle,
            progressionLevel: assignedLevel,
          };
        });

        resolve(puzzlesWithLevels);
      });
  });
}
