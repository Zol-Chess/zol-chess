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
    <div className={`flex items-center gap-2 mb-6 ${className}`}>
      <div className="w-1 h-4 bg-primary shrink-0" />
      <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground leading-short">
        {title}
      </h2>
      {badge && <div className="ml-auto">{badge}</div>}
    </div>
  );
}
