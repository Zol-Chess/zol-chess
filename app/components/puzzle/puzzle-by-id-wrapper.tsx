"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { decryptSolution } from "@/script/decrypt-solution";
import { getPuzzleById } from "@/services/puzzle.ts";
import { Puzzle } from "@/services/puzzle.ts/puzzle.types";
import { showToast } from "@/lib/toast";
import { catchErr } from "@/utils/error-handlers";
import { useWalletValues } from "@/lib/wallet/context";
import { useCluster } from "@/components/cluster-context";

import MainPlay from "./main-play";

interface PuzzleByIdWrapperProps {
  id: string;
}

const PuzzleByIdWrapper = ({ id }: PuzzleByIdWrapperProps) => {
  const router = useRouter();
  const { signer, connect } = useWalletValues();
  const { cluster } = useCluster();
  const playerPubkey = signer?.address ?? "";

  const { data: puzzle, isLoading } = useSWR<Puzzle | null>(
    id && playerPubkey ? ["puzzle", id, playerPubkey, cluster] : null,
    async () => {
      try {
        const puzzleResponse = await getPuzzleById(id, playerPubkey, cluster);
        if (!puzzleResponse.encryptedSolution || !puzzleResponse.solutionKey) {
          showToast("Puzzle solution unavailable.", "error");
          return null;
        }

        const moves = await decryptSolution(
          puzzleResponse.encryptedSolution,
          puzzleResponse.solutionKey
        );

        if (!moves) {
          showToast("Failed to decrypt puzzle solution.", "error");
          return null;
        }

        return { ...puzzleResponse, moves };
      } catch (error) {
        showToast(catchErr(error).message ?? "Failed to load puzzle.", "error");
        return null;
      }
    }
  );

  useEffect(() => {
    if (puzzle && puzzle.id !== id) {
      router.replace(`/puzzles/${puzzle.id}`);
    }
  }, [puzzle, id, router]);

  if (!playerPubkey) {
    return (
      <main className="ml-64 pt-24 px-8 pb-12 flex items-center justify-center min-h-screen">
        <div className="glass-panel neon-border p-10 flex flex-col items-center gap-6 text-center max-w-md">
          <span className="material-symbols-outlined text-primary text-5xl">
            account_balance_wallet
          </span>
          <h2 className="font-mono text-primary font-bold uppercase tracking-widest text-sm">
            Wallet Required
          </h2>
          <p className="font-mono text-xs text-chess-muted uppercase tracking-wider leading-relaxed">
            Connect your wallet to load and submit puzzle solutions on-chain.
          </p>
          <button
            onClick={connect}
            className="bg-primary text-chess-bg px-8 py-3 font-bold hover:shadow-[0_0_15px_rgba(20,241,149,0.5)] transition-all uppercase font-mono text-xs tracking-widest"
          >
            Connect Wallet
          </button>
        </div>
      </main>
    );
  }

  return (
    <MainPlay
      key={puzzle ? `${puzzle.puzzleId}:${puzzle.id ?? id}` : `${id}:loading`}
      signer={signer}
      puzzle={puzzle ?? null}
      isLoading={isLoading}
    />
  );
};

export default PuzzleByIdWrapper;
