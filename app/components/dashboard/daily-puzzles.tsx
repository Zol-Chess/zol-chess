"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthStore } from "@/state/auth";
import { usePuzzleStore } from "@/state/puzzle";
import { getRandomPuzzles } from "@/services/puzzle.ts";
import { showToast } from "@/lib/toast";
import { catchErr } from "@/utils/error-handlers";

import { ChessBoardPreview } from "./chess-board-preview";
import { GlassPanel } from "./glass-panel";
import { SectionHeader } from "./section-header";

function SolanaIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 397 311"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zM332.3 120.9c2.4-2.4 5.7-3.8 9.2-3.8H24c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

const DailyPuzzles = () => {
  const [loading, setLoading] = useState(false);

  const user = useAuthStore((state) => state.user);
  const walletStatus = useAuthStore((state) => state.walletStatus);
  const setPuzzles = usePuzzleStore((state) => state.updatePuzzleList);

  const router = useRouter();

  const getPuzzles = async () => {
    try {
      if (walletStatus !== "connected") {
        throw Error("Please connect your wallet to continue");
      }
      setLoading(true);
      const puzzles = await getRandomPuzzles(user?.player_rating ?? 800, 5);

      if (!puzzles.length) {
        showToast("No puzzles available right now. Please try again later.");
        return;
      }

      setPuzzles(puzzles);
      router.push(`/puzzles/${puzzles[0].id}`);
    } catch (error) {
      showToast(
        catchErr(error).message ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="xl:col-span-4">
      <GlassPanel className="p-5 sm:p-6 relative overflow-hidden h-full flex flex-col">
        {/* Active mission badge */}
        <div className="absolute top-0 right-0 p-4">
          <div className="bg-primary/10 text-primary px-3 py-1 border border-primary/30 font-mono text-[10px] sm:text-xs tracking-normal sm:tracking-widest uppercase animate-pulse leading-short">
            ACTIVE MISSION
          </div>
        </div>

        <SectionHeader title="Daily Puzzle" className="mt-2" />

        <ChessBoardPreview />

        {/* Puzzle meta */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center gap-4 py-2 border-b border-primary/10">
            <span className="font-mono text-xs text-chess-muted uppercase tracking-widest leading-short">
              Difficulty:
            </span>
            <span className="font-mono text-xs text-primary font-bold leading-short">
              {user?.next_difficulty ?? "---"}+
            </span>
          </div>
          {/* <div className="flex justify-between items-center py-2 border-b border-primary/10">
            <span className="font-mono text-xs text-chess-muted uppercase tracking-widest leading-short">
              Reward
            </span>
            <div className="flex items-center gap-1 font-mono text-xs text-primary leading-short">
              <SolanaIcon className="w-3 h-3" />
              0.25 SOL
            </div>
          </div> */}
        </div>

        <button
          className="mt-auto w-full py-4 bg-primary text-chess-bg font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(20,241,149,0.3)] hover:brightness-110 active:scale-95 transition-all border border-primary/40 leading-short disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          onClick={getPuzzles}
          disabled={loading}
        >
          {loading ? "Loading..." : "Start Puzzle"}
        </button>
      </GlassPanel>
    </div>
  );
};

export default DailyPuzzles;
