"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { generateKeyPairSigner, getBase64Encoder } from "@solana/kit";

import {
  decodeAchievementReward,
  fetchMaybePlayerProfile,
  fetchMaybePuzzleHistory,
  fetchMaybeRewardsConfig,
  fetchMaybeUserAchievementClaim,
  getAchievementRewardDiscriminatorBytes,
  type AchievementReward,
  type PuzzleHistory,
} from "@/generated/zol_chess_program/accounts";
import {
  getClaimAchievementInstructionAsync,
  getClaimTokensInstructionAsync,
} from "@/generated/zol_chess_program/instructions";
import {
  findPlayerProfilePda,
  findPuzzleHistoryPda,
  findRewardConfigPda,
  findUserAchievementClaimPda,
} from "@/generated/zol_chess_program/pdas";
import { ZOL_CHESS_PROGRAM_PROGRAM_ADDRESS } from "@/generated/zol_chess_program/programs";
import { showToast } from "@/lib/toast";
import { catchErr } from "@/utils/error-handlers";

import { useCluster } from "../../components/cluster-context";
import { useSolanaClient } from "../solana-client-context";
import { useWalletValues } from "../wallet/context";
import { useSendTransaction } from "./use-send-transaction";

export type PuzzleActivity = {
  puzzleId: string;
  timestamp: Date;
  attempts: number;
  solved: boolean;
  timeTaken: number;
};

export type AchievementStatus = AchievementReward & {
  claimed: boolean;
  unlocked: boolean;
};

function decodeHistory(history: PuzzleHistory): PuzzleActivity[] {
  const decoder = new TextDecoder();
  const count = Math.min(history.count, history.recentRecords.length);

  return Array.from({ length: count }, (_, offset) => {
    const index =
      (history.recentIndex - 1 - offset + history.recentRecords.length) %
      history.recentRecords.length;
    const record = history.recentRecords[index]!;
    const view = new DataView(
      record.buffer,
      record.byteOffset,
      record.byteLength
    );

    return {
      puzzleId: decoder.decode(record.slice(0, 5)).replace(/\0/g, ""),
      timeTaken: view.getUint32(5, true),
      attempts: record[9] ?? 0,
      solved: record[10] === 1,
      timestamp: new Date(Number(view.getBigInt64(11, true)) * 1000),
    };
  });
}

export function useRewards() {
  const client = useSolanaClient();
  const { cluster } = useCluster();
  const { signer, wallet } = useWalletValues();
  const { send, isSending } = useSendTransaction();
  const player = wallet?.account.address;

  const key = player && signer ? ["onchain-rewards", cluster, player] : null;
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const claimTokensInstruction = await getClaimTokensInstructionAsync({
      player: signer!,
    });
    const generatedRewardMint = claimTokensInstruction.accounts[4].address;
    const generatedPlayerAta = claimTokensInstruction.accounts[5].address;

    const [[playerProfile], [puzzleHistory], [rewardConfig]] =
      await Promise.all([
        findPlayerProfilePda({ player: player! }),
        findPuzzleHistoryPda({ authority: player! }),
        findRewardConfigPda(),
      ]);

    const [profileAccount, historyAccount, configAccount, programAccounts] =
      await Promise.all([
        fetchMaybePlayerProfile(client.rpc, playerProfile),
        fetchMaybePuzzleHistory(client.rpc, puzzleHistory),
        fetchMaybeRewardsConfig(client.rpc, rewardConfig),
        client.rpc
          .getProgramAccounts(ZOL_CHESS_PROGRAM_PROGRAM_ADDRESS, {
            encoding: "base64",
          })
          .send(),
      ]);

    const discriminator = getAchievementRewardDiscriminatorBytes();
    const achievementAccounts = programAccounts
      .map(({ pubkey, account }) => {
        const bytes = getBase64Encoder().encode(account.data[0]);
        if (
          bytes.length < discriminator.length ||
          !discriminator.every((byte, index) => bytes[index] === byte)
        ) {
          return null;
        }

        return decodeAchievementReward({
          address: pubkey,
          data: bytes,
          executable: account.executable,
          lamports: account.lamports,
          programAddress: account.owner,
          space: BigInt(bytes.length),
        });
      })
      .filter((account): account is NonNullable<typeof account> => !!account)
      .sort((a, b) => a.data.achievementId - b.data.achievementId);

    const claims = await Promise.all(
      achievementAccounts.map(async ({ data: achievement }) => {
        const [claimAddress] = await findUserAchievementClaimPda({
          player: player!,
          achievementId: achievement.achievementId,
        });
        return fetchMaybeUserAchievementClaim(client.rpc, claimAddress);
      })
    );

    const tokenInitialized =
      configAccount.exists &&
      configAccount.data.rewardMint === generatedRewardMint;

    let collectionInitialized = false;
    if (configAccount.exists) {
      const asset = await generateKeyPairSigner();
      const generatedAchievementClaim =
        await getClaimAchievementInstructionAsync({
          player: signer!,
          asset,
          rewardCollection: configAccount.data.rewardCollection,
          achievementId: 0,
        });
      const mplCoreProgram = generatedAchievementClaim.accounts[8].address;
      const collectionAccount = await client.rpc
        .getAccountInfo(configAccount.data.rewardCollection, {
          encoding: "base64",
        })
        .send();
      collectionInitialized = collectionAccount.value?.owner === mplCoreProgram;
    }

    let tokenBalance = 0;
    if (tokenInitialized) {
      try {
        const balance = await client.rpc
          .getTokenAccountBalance(generatedPlayerAta)
          .send();
        tokenBalance = Number(balance.value.uiAmountString ?? "0");
      } catch {
        tokenBalance = 0;
      }
    }

    const achievementMask = profileAccount.exists
      ? profileAccount.data.achievements
      : 0n;

    return {
      profile: profileAccount.exists ? profileAccount.data : null,
      history: historyAccount.exists ? decodeHistory(historyAccount.data) : [],
      historySummary: historyAccount.exists
        ? {
            currentStreak: historyAccount.data.currentStreak,
            longestStreak: historyAccount.data.longestStreak,
            solved: historyAccount.data.puzzlesSolved,
            attempted: historyAccount.data.puzzlesAttempted,
          }
        : null,
      config: configAccount.exists ? configAccount.data : null,
      tokenInitialized,
      collectionInitialized,
      tokenBalance,
      achievements: achievementAccounts.map(({ data: achievement }, index) => ({
        ...achievement,
        claimed: claims[index]?.exists ?? false,
        unlocked: (achievementMask & achievement.requiredBit) !== 0n,
      })) satisfies AchievementStatus[],
    };
  });

  const claimablePoints = data?.profile
    ? Math.max(data.profile.totalPoints - data.profile.claimedPoints, 0)
    : 0;

  const claimTokens = useCallback(async () => {
    if (!signer) {
      showToast("Connect your wallet to claim rewards.", "warning");
      return;
    }
    if (!data?.config || !data.tokenInitialized) {
      showToast("The ZOL reward mint has not been initialized.", "warning");
      return;
    }
    if (claimablePoints === 0) {
      showToast("No ZOL rewards are available to claim.", "warning");
      return;
    }

    try {
      const instruction = await getClaimTokensInstructionAsync({
        player: signer,
      });
      await send({ instructions: [instruction] });
      await mutate();
      showToast(`${claimablePoints} ZOL claimed.`, "success");
    } catch (claimError) {
      showToast(catchErr(claimError).message ?? "Token claim failed.", "error");
    }
  }, [claimablePoints, data, mutate, send, signer]);

  const claimAchievement = useCallback(
    async (achievement: AchievementStatus) => {
      if (!signer || !data?.config || !data.collectionInitialized) {
        showToast(
          "Connect your wallet and initialize the reward collection first.",
          "warning"
        );
        return;
      }
      if (!achievement.unlocked || achievement.claimed) return;

      try {
        const asset = await generateKeyPairSigner();
        const instruction = await getClaimAchievementInstructionAsync({
          player: signer,
          asset,
          rewardCollection: data.config.rewardCollection,
          achievementId: achievement.achievementId,
        });
        await send({ instructions: [instruction] });
        await mutate();
        showToast(`${achievement.name} achievement claimed.`, "success");
      } catch (claimError) {
        showToast(
          catchErr(claimError).message ?? "Achievement claim failed.",
          "error"
        );
      }
    },
    [data, mutate, send, signer]
  );

  return useMemo(
    () => ({
      ...data,
      claimablePoints,
      claimTokens,
      claimAchievement,
      isLoading,
      isSending,
      error,
      connected: !!player,
    }),
    [
      claimAchievement,
      claimTokens,
      claimablePoints,
      data,
      error,
      isLoading,
      isSending,
      player,
    ]
  );
}
