import { API } from "..";

import { PuzzleResponse } from "./puzzle.types";

export const getRandomPuzzles = async (
  rating: number,
  count = 10
): Promise<PuzzleResponse[]> => {
  try {
    const { data } = await API.get<{ puzzles: PuzzleResponse[] }>("puzzles", {
      params: { rating, count },
    });

    return data.puzzles;
  } catch (error) {
    throw error;
  }
};

// Fallback fetch for direct URL navigation when puzzleStore is empty
export const getPuzzleById = async (id: string): Promise<PuzzleResponse> => {
  try {
    const { data } = await API.get<PuzzleResponse>(`puzzles/${id}`);
    console.log({ data });

    return data;
  } catch (error) {
    console.log(error);

    throw error;
  }
};

export const submitSolution = async (
  puzzleId: string,
  signature: string
): Promise<{ success: boolean }> => {
  const { data } = await API.post<{ success: boolean }>("puzzles/submit", {
    puzzleId,
    signature,
  });
  return data;
};
