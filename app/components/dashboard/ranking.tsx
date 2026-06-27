"use client";

import { useAuthStore } from "@/state/auth";

import { GlassPanel } from "./glass-panel";

function Ranking() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:gap-4">
      <GlassPanel className="p-4 sm:p-5 min-w-0 sm:min-w-40">
        <span className="block font-mono text-xs text-chess-muted uppercase tracking-widest mb-2 border-b border-primary/20 pb-1 leading-short">
          Player Rating
        </span>
        <span className="block font-mono text-h6 text-foreground glow-text-green font-bold leading-short">
          #{user?.player_rating ?? "---"}
        </span>
      </GlassPanel>
      <GlassPanel className="p-4 sm:p-5 min-w-0 sm:min-w-40">
        <span className="block font-mono text-xs text-chess-muted uppercase tracking-widest mb-2 border-b border-primary/20 pb-1 leading-short">
          Global Rank
        </span>
        <span className="block font-mono text-h6 text-foreground font-bold leading-short">
          #{user?.global_rank ?? "---"}
        </span>
      </GlassPanel>
    </div>
  );
}

export default Ranking;
