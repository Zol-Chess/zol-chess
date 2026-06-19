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
    }
  );

  useEffect(() => {
    if (!signer || !data?.playerAccount || isSending) return;

    if (data.playerAccount.exists) {
      const profileData = data.playerAccount.data;
      const historyData = data.historyAccount?.exists
        ? data.historyAccount.data
        : null;

      updateProfile({
        player_rating: profileData.elo,
        highest_rating: profileData.highestRating,
        nft_count: profileData.nftCount,
        puzzles_solved: historyData?.puzzlesSolved,
        puzzles_attempted: historyData?.puzzlesAttempted,
        current_streak: historyData?.currentStreak,
        longest_streak: historyData?.longestStreak,
      });
      return;
    }

    if (initSentRef.current) return;
    initSentRef.current = true;

    getInitializeUserInstructionAsync({ user: signer })
      .then((ix) => send({ instructions: [ix] }))
      .then(() => mutate())
      .catch((err) => {
        console.error("[usePlayerProfile] init failed:", err);
        showToast(err.message);
        initSentRef.current = false;
        mutate();
      });
  }, [signer, data?.playerAccount?.exists]); // eslint-disable-line react-hooks/exhaustive-deps
  console.log({ address, player: data?.playerAccount });

  return {
    profile: data?.playerAccount?.exists ? data.playerAccount.data : null,
    isLoading,
    isInitializing: isSending,
  };
}
