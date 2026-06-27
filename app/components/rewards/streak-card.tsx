type StreakCardProps = {
  currentStreak: number;
  longestStreak: number;
  solved: number;
};

export function StreakCard({
  currentStreak,
  longestStreak,
  solved,
}: StreakCardProps) {
  const totalSegments = 7;
  const activeSegments = Math.min(currentStreak, totalSegments);
  const progressPercent = Math.round((activeSegments / totalSegments) * 100);
  const segments = Array.from({ length: totalSegments }, (_, i) => i);

  return (
    <div className="lg:col-span-4 glass-panel p-5 sm:p-6 lg:p-8 flex flex-col justify-between border border-primary/30 shadow-[0_0_15px_rgba(20,241,149,0.1),inset_0_0_10px_rgba(20,241,149,0.05)]">
      <div>
        <div className="flex justify-between items-center mb-6 lg:mb-8 border-b border-primary/20 pb-4">
          <p className="text-primary font-mono text-xs tracking-widest uppercase leading-short">
            UPTIME_STREAK
          </p>
          <span className="material-symbols-outlined text-primary animate-pulse">
            sensors
          </span>
        </div>
        <h2 className="text-[clamp(2rem,12vw,3.5rem)] font-display font-bold text-foreground leading-none">
          {currentStreak} WINS
        </h2>
        <p className="text-chess-muted font-mono text-xs mt-4 uppercase tracking-normal leading-long">
          LONGEST: {longestStreak}
          {" // "}
          PUZZLES_SOLVED: {solved}
        </p>
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-[10px] text-primary mb-2 uppercase font-mono">
          <span>Stability: Optimal</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 h-3">
          {segments.map((segment) => (
            <div
              key={segment}
              className={
                segment < activeSegments
                  ? "bg-primary shadow-[0_0_8px_rgba(20,241,149,0.3)]"
                  : "bg-primary/15 border border-primary/25"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
