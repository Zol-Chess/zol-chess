import { AchievementBadge } from "./achievement-badge";
import { GlassPanel } from "./glass-panel";
import { SectionHeader } from "./section-header";

const ACHIEVEMENTS = [
  { icon: "swords", label: "First Solve", bit: 0, unlocked: true },
  { icon: "bolt", label: "10 Puzzle Streak", bit: 1, unlocked: true },
  { icon: "dark_mode", label: "100 Puzzles Solved", bit: 2, unlocked: true },
  { icon: "lock", label: "Grandmaster", bit: 3, unlocked: false },
  { icon: "lock", label: "Endgame Master", bit: 4, unlocked: false },
] as const;

function NeuralAchievements() {
  return (
    <GlassPanel className="p-6 flex flex-col">
      <SectionHeader title="Neural Achievement Grid" />
      <div className="grid grid-cols-3 gap-4 flex-1 content-center">
        {ACHIEVEMENTS.map((a) => (
          <AchievementBadge
            key={a.label}
            icon={a.icon}
            label={a.label}
            unlocked={a.unlocked}
          />
        ))}
      </div>
    </GlassPanel>
  );
}

export default NeuralAchievements;
