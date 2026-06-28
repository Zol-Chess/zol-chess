import type { AchievementStatus } from "@/lib/hooks/use-rewards";

function achievementClass(achievement: AchievementStatus) {
  if (achievement.claimed) {
    return "bg-chess-container-hi border-primary/30 hover:bg-primary/5 hover:border-primary text-primary";
  }

  if (achievement.unlocked && achievement.active) {
    return "bg-primary/10 border-primary text-primary hover:bg-primary/20 cursor-pointer";
  }

  return "bg-chess-container border-white/5 opacity-30 grayscale text-chess-muted cursor-not-allowed";
}

export function AchievementNodes({
  achievements,
  isClaiming,
  onClaim,
}: {
  achievements: AchievementStatus[];
  isClaiming: boolean;
  onClaim: (achievement: AchievementStatus) => void;
}) {
  return (
    <div className="glass-panel p-5 sm:p-6 border-primary/30">
      <h3 className="font-mono text-xs mb-5 sm:mb-6 uppercase tracking-normal sm:tracking-[0.3em] text-chess-muted border-b border-primary/20 pb-4 flex items-center gap-2 leading-short">
        <span className="material-symbols-outlined text-primary text-sm">
          verified user
        </span>
        Achievement Nodes
      </h3>

      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
        {achievements.map((achievement) => (
          <button
            type="button"
            key={achievement.achievementId}
            onClick={() => onClaim(achievement)}
            disabled={
              isClaiming ||
              achievement.claimed ||
              !achievement.unlocked ||
              !achievement.active
            }
            className={`aspect-square min-h-24 flex flex-col items-center justify-center border transition-all group cursor-help ${achievementClass(
              achievement
            )}`}
            title={achievement.name}
          >
            <span className="material-symbols-outlined text-3xl mb-1">
              {achievement.claimed
                ? "verified"
                : achievement.unlocked
                  ? "workspace premium"
                  : "lock"}
            </span>
            <span className="font-mono text-[9px] uppercase text-center px-1 tracking-normal text-chess-muted group-hover:text-current leading-short break-words">
              {achievement.name}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full mt-6 text-chess-muted font-mono text-[11px] uppercase py-2 px-3 border border-primary/20 bg-primary/5 leading-short">
        {achievements.length === 0
          ? "No achievement rewards configured"
          : `${achievements.filter((item) => item.claimed).length}/${achievements.length} assets claimed`}
      </div>
    </div>
  );
}
