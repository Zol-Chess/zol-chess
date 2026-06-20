"use client";

import { useEffect, useState } from "react";

import { decryptSolution } from "@/script/encrypt-solution";
import { getPuzzleById } from "@/services/puzzle.ts";
import { Puzzle } from "@/services/puzzle.ts/puzzle.types";
import { showToast } from "@/lib/toast";
import { catchErr } from "@/utils/error-handlers";
import { useWalletValues } from "@/lib/wallet/context";

import MainPlay from "./main-play";

interface PuzzleByIdWrapperProps {
  id: string;
}

const PuzzleByIdWrapper = ({ id }: PuzzleByIdWrapperProps) => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signer, connect } = useWalletValues();
  const playerPubkey = signer?.address ?? "";

  useEffect(() => {
    if (!id || !playerPubkey) return;

    setIsLoading(true);
    setPuzzle(null);

    getPuzzleById(id, playerPubkey)
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
  }, [id, playerPubkey]);

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

  return <MainPlay signer={signer} puzzle={puzzle} isLoading={isLoading} />;
};

export default PuzzleByIdWrapper;
