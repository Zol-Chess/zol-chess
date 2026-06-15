import { GlassPanel } from "./glass-panel";

type StatCardProps = {
  icon: string;
  badge: string;
  label: string;
  value: string;
  glowValue?: boolean;
};

export function StatCard({
  icon,
  badge,
  label,
  value,
  glowValue = false,
}: StatCardProps) {
  return (
    <GlassPanel className="p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-primary/30">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-0.5 border border-primary/20 leading-short">
          {badge}
        </span>
      </div>
      <div>
        <h4 className="font-mono text-xs text-chess-muted uppercase tracking-widest mb-1 leading-short">
          {label}
        </h4>
        <p
          className={`font-mono text-h6 text-foreground font-bold leading-short ${glowValue ? "glow-text-green" : ""}`}
        >
          {value}
        </p>
      </div>
    </GlassPanel>
  );
}
