type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div className={`glass-panel neon-border ${className}`}>{children}</div>
  );
}
