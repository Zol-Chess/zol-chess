export function BoostMultiplier({ nftCount }: { nftCount: number }) {
  return (
    <div className="glass-panel p-6 border-primary/30">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
          <span className="material-symbols-outlined text-primary">
            auto_awesome
          </span>
        </div>
        <div>
          <h4 className="font-bold font-mono text-xs uppercase text-primary leading-short">
            Boost_Multiplier
          </h4>
          <p className="text-[11px] font-mono text-chess-muted leading-short mt-1">
            ACHIEVEMENT_ASSETS: {nftCount}
            {" // "}
            NO TOKEN MULTIPLIER
          </p>
        </div>
      </div>
    </div>
  );
}
