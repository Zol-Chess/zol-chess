type AchievementBadgeProps = {
  icon: string;
  label: string;
  unlocked?: boolean;
};

export function AchievementBadge({
  icon,
  label,
  unlocked = true,
}: AchievementBadgeProps) {
  if (!unlocked) {
    return (
      <div className="aspect-square border border-primary/10 bg-chess-container flex flex-col items-center justify-center p-2 text-center opacity-40 grayscale">
        <span className="material-symbols-outlined text-chess-muted text-2xl mb-1.5">
          lock
        </span>
        <span className="font-mono text-xs text-chess-muted uppercase leading-tight">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="aspect-square border border-primary bg-primary/20 flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-primary/30 transition-all">
      <span className="material-symbols-outlined text-primary text-2xl mb-1">
        {icon}
      </span>
      <span className="font-mono text-xs text-primary uppercase leading-tight leading-short">
        {label}
      </span>
    </div>
  );
}
