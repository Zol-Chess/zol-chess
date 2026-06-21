"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";

import {
  fetchMaybePlayerProfile,
  fetchMaybePuzzleHistory,
} from "@/generated/zol_chess_program/accounts";
import {
  findPlayerInfoPda,
  findPuzzleHistoryPda,
} from "@/generated/zol_chess_program/pdas";
import { getInitializeUserInstructionAsync } from "@/generated/zol_chess_program/instructions";
import { useAuthStore } from "@/state/auth";

import { useWalletValues } from "../wallet/context";
import { useSolanaClient } from "../solana-client-context";
import { useSendTransaction } from "./use-send-transaction";
import { showToast } from "../toast";

export function usePlayerProfile() {
  const { signer, wallet } = useWalletValues();
  const client = useSolanaClient();
  const { send, isSending } = useSendTransaction();
  const address = wallet?.account.address;

  const updateProfile = useAuthStore((state) => state.updateUser);
  const initSentRef = useRef(false);
  const lastProfileRef = useRef<string>(null);

  useEffect(() => {
    initSentRef.current = false;
  }, [signer]);

  const { data, isLoading, mutate } = useSWR(
    address ? ["chain-profile", address] : null,
    async ([, addr]) => {
      const [[playerInfoAddr], [puzzleHistoryAddr]] = await Promise.all([
        findPlayerInfoPda({ user: addr }),
        findPuzzleHistoryPda({ authority: addr }),
      ]);

      const [playerAccount, historyAccount] = await Promise.all([
        fetchMaybePlayerProfile(client.rpc, playerInfoAddr),
        fetchMaybePuzzleHistory(client.rpc, puzzleHistoryAddr),
      ]);

      return { playerAccount, historyAccount };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (!signer) return;
    if (!data?.playerAccount) return;
    if (data.playerAccount.exists) return;
    if (isSending) return;
    if (initSentRef.current) return;

    initSentRef.current = true;

    (async () => {
      try {
        const ix = await getInitializeUserInstructionAsync({
          user: signer,
        });

        await send({ instructions: [ix] });
        await mutate();
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to get user details"
        );
        initSentRef.current = false;
      }
    })();
  }, [signer, data?.playerAccount?.exists]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data?.playerAccount.exists) return;

    if (data.playerAccount.exists) {
      const profileData = data.playerAccount.data;
      const historyData = data.historyAccount?.exists
        ? data.historyAccount.data
        : null;

      const solved = historyData?.puzzlesSolved ?? 0;
      const attempted = historyData?.puzzlesAttempted ?? 0;

      let average_solve_time = 0;
      if (historyData && historyData.count > 0) {
        const records = Array.from(historyData.recentRecords).slice(
          0,
          historyData.count
        );
        const solvedTimes = records
          .filter((r) => r[10] === 1)
          .map((r) => r[5] | (r[6] << 8) | (r[7] << 16) | (r[8] << 24));
        if (solvedTimes.length > 0) {
          average_solve_time = Math.round(
            solvedTimes.reduce((a, b) => a + b, 0) / solvedTimes.length
          );
        }
      }

      const userData = {
        player_rating: profileData.elo,
        highest_rating: profileData.highestRating,
        nft_count: profileData.nftCount,
        puzzles_solved: solved,
        puzzles_attempted: attempted,
        current_streak: historyData?.currentStreak,
        longest_streak: historyData?.longestStreak,
        achievementsMask: Number(profileData.achievements),
        success_rate:
          attempted > 0 ? Math.round((solved / attempted) * 100) : 0,
        average_solve_time,
        next_difficulty: profileData.elo,
      };

      const snapshot = JSON.stringify(userData);

      if (snapshot !== lastProfileRef.current) {
        lastProfileRef.current = snapshot;

        updateProfile(userData);
      }

      return;
    }
  }, [data, updateProfile]);
  console.log({ address, player: data?.playerAccount });

  return {
    profile: data?.playerAccount?.exists ? data.playerAccount.data : null,
    isLoading,
    isInitializing: isSending,
  };
}
