import type { Achievement } from "./models";
import { achievements } from "./models";

function achievementClass(tone: Achievement["tone"]) {
  if (tone === "green") {
    return "bg-chess-container-hi border-primary/30 hover:bg-primary/5 hover:border-primary text-primary";
  }

  return "bg-chess-container border-white/5 opacity-30 grayscale text-chess-muted cursor-not-allowed";
}

export function AchievementNodes() {
  return (
    <div className="glass-panel p-6 border-primary/30">
      <h3 className="font-mono text-xs mb-6 uppercase tracking-[0.3em] text-chess-muted border-b border-primary/20 pb-4 flex items-center gap-2 leading-short">
        <span className="material-symbols-outlined text-primary text-sm">
          verified_user
        </span>
        Achievement_Nodes
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.label}
            className={`aspect-square flex flex-col items-center justify-center border transition-all group cursor-help ${achievementClass(
              achievement.tone
            )}`}
            title={achievement.title}
          >
            <span className="material-symbols-outlined text-3xl mb-1">
              {achievement.icon}
            </span>
            <span className="font-mono text-[9px] uppercase text-center px-1 tracking-normal text-chess-muted group-hover:text-current leading-short">
              {achievement.label}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 text-chess-muted font-mono text-[11px] uppercase hover:text-primary transition-colors py-2 border border-primary/20 bg-primary/5 leading-short">
        Exp: View_All_Indices(42)
      </button>
    </div>
  );
}
