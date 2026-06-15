"use client";

import { useAuthStore } from "@/state/auth";

import { GlassPanel } from "./glass-panel";
import { SectionHeader } from "./section-header";

const PROFILE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAaK5NsNyA8cPvbHFL-KkSEIH9Qpm4OaCx09AzzBKtgqupbojAeJl88_vewYpvd92YE7th9y_FjrX2Ek40hJolZRDEXkgFB4_NsIH_xcLOXgQhkrVXrHvB8FVkbBk8sxiJQM9CBh-gB8Hkg1ssDVBLwBQNzSBvTWwh6wRnYJ_dMJ_hprx01rN4t3WoJ66BMXdFPttwurgWw8fJT4PJiK2tWQfpQdgtbk5wRKs-ZdTIdV9Yd16ewebvcndMnNkwDVrkyeWL8d3u-oYU";

function PlayerProfile() {
  const user = useAuthStore((state) => state.user);

  return (
    <GlassPanel className="p-6 flex flex-col">
      <SectionHeader title="Player Profile" />
      <div className="flex flex-col items-center text-center flex-1 justify-center">
        <div className="relative w-32 h-32 mb-6 border-2 border-primary p-2 rounded-sm">
          <img
            src={PROFILE_IMG}
            alt="Tactician Emblem"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
          />
          <div className="absolute inset-0 border border-primary/30 animate-pulse" />
        </div>
        <h3
          className="text-h6 font-bold text-primary uppercase mb-1 leading-short"
          style={{
            fontFamily: "var(--font-space-grotesk, sans-serif)",
          }}
        >
          Puzzle Rating: #{user?.puzzle_rating ?? "---"}
        </h3>
        {user?.achievements.length && (
          <p className="font-mono text-xs text-chess-muted uppercase tracking-widest mb-6 leading-short">
            Achievements
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {user?.achievements.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase tracking-wider leading-short"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

export default PlayerProfile;
