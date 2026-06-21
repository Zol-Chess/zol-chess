"use client";

import { useAuthStore } from "@/state/auth";

import { AchievementBadge } from "./achievement-badge";
import { GlassPanel } from "./glass-panel";
import { SectionHeader } from "./section-header";

const ACHIEVEMENTS = [
  { icon: "swords", label: "First Solve", bit: 0 },
  { icon: "bolt", label: "10 Puzzle Streak", bit: 1 },
  { icon: "dark_mode", label: "100 Puzzles Solved", bit: 2 },
  { icon: "lock", label: "Grandmaster", bit: 3 },
  { icon: "lock", label: "Endgame Master", bit: 4 },
] as const;

function NeuralAchievements() {
  const mask = useAuthStore((s) => s.user?.achievementsMask ?? 0);

  return (
    <GlassPanel className="p-6 flex flex-col">
      <SectionHeader title="Neural Achievement Grid" />
      <div className="grid grid-cols-3 gap-4 flex-1 content-center">
        {ACHIEVEMENTS.map((a) => (
          <AchievementBadge
            key={a.label}
            icon={a.icon}
            label={a.label}
            unlocked={Boolean((mask >> a.bit) & 1)}
          />
        ))}
      </div>
    </GlassPanel>
  );
}

export default NeuralAchievements;
