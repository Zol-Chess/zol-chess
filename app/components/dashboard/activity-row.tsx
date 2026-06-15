type ActivityRowProps = {
  avatar: string;
  username: string;
  puzzleId: string;
  reward: string;
};

export function ActivityRow({
  avatar,
  username,
  puzzleId,
  reward,
}: ActivityRowProps) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-sm border border-primary/30 overflow-hidden bg-chess-container shrink-0">
          <img
            alt={username}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
            src={avatar}
          />
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-foreground font-bold text-sm leading-short">
            {username}
          </span>
          <span className="text-chess-muted text-xs uppercase leading-short">
            Solved
          </span>
          <span className="text-primary font-bold text-sm tracking-tighter leading-short">
            {puzzleId}
          </span>
        </div>
      </div>
      <span className="text-primary font-bold font-mono text-sm leading-short">
        +{reward}
      </span>
    </div>
  );
}
