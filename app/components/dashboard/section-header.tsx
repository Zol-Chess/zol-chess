type SectionHeaderProps = {
  title: string;
  badge?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  badge,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-6 ${className}`}>
      <div className="w-1 h-4 bg-primary shrink-0" />
      <h2 className="min-w-0 font-mono text-sm font-bold uppercase tracking-normal sm:tracking-[0.2em] text-foreground leading-short break-words">
        {title}
      </h2>
      {badge && <div className="ml-auto">{badge}</div>}
    </div>
  );
}
