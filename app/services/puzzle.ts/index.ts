import { API } from "..";

import { PuzzleResponse } from "./puzzle.types";

export const getRandomPuzzles = async (
  rating: number,
  count = 10,
  playerPubkey = "",
  cluster = ""
): Promise<PuzzleResponse[]> => {
  try {
    const { data } = await API.get<{ puzzles: PuzzleResponse[] }>("puzzles", {
      params: { rating, count, player: playerPubkey, cluster },
    });

    return data.puzzles;
  } catch (error) {
    throw error;
  }
};

// Fallback fetch for direct URL navigation when puzzleStore is empty
export const getPuzzleById = async (
  id: string,
  playerPubkey = "",
  cluster = ""
): Promise<PuzzleResponse> => {
  try {
    const { data } = await API.get<PuzzleResponse>(`puzzles/${id}`, {
      params: { player: playerPubkey, cluster },
    });

    return data;
  } catch (error) {
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
