type RewardsTotalCardProps = {
  totalPoints: number;
  claimedPoints: number;
  tokenBalance: number;
  claimablePoints: number;
  paused: boolean;
  initialized: boolean;
  isClaiming: boolean;
  onClaim: () => void;
};

export function RewardsTotalCard({
  totalPoints,
  claimedPoints,
  tokenBalance,
  claimablePoints,
  paused,
  initialized,
  isClaiming,
  onClaim,
}: RewardsTotalCardProps) {
  const disabled =
    !initialized || paused || claimablePoints === 0 || isClaiming;

  return (
    <div className="lg:col-span-8 glass-panel neon-border p-5 sm:p-6 lg:p-8 flex flex-col justify-between overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-[88px] sm:text-[120px]">
          currency_exchange
        </span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px w-8 bg-primary" />
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase leading-short">
            Liquidity_Status
          </p>
        </div>
        <h1 className="font-display text-[clamp(2rem,12vw,4rem)] text-foreground flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-none break-words">
          <span className="min-w-0 break-all">
            {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </span>
          <span className="text-primary text-lg sm:text-xl font-bold tracking-normal">
            ZOL
          </span>
        </h1>
        <div className="flex flex-col gap-1 mt-4 sm:flex-row sm:items-center sm:gap-2">
          <p className="text-chess-muted font-mono text-xs leading-short">
            EARNED:
          </p>
          <p className="text-primary font-mono text-xs font-bold leading-short break-words">
            {totalPoints} ZOL // CLAIMED_POINTS: {claimedPoints}
          </p>
        </div>
      </div>

      <div className="mt-8 lg:mt-12 flex flex-col md:flex-row gap-4 lg:gap-6 items-stretch md:items-center">
        <button
          type="button"
          onClick={onClaim}
          disabled={disabled}
          className="bg-primary disabled:bg-primary/20 disabled:text-chess-muted disabled:cursor-not-allowed text-chess-bg px-5 py-4 sm:px-10 sm:py-5 font-bold font-mono text-xs uppercase tracking-normal sm:tracking-widest flex items-center justify-center gap-3 hover:enabled:brightness-110 hover:enabled:shadow-[0_0_25px_rgba(20,241,149,0.4)] active:enabled:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">terminal</span>
          {isClaiming ? "CLAIM_PENDING" : `CLAIM_${claimablePoints}_ZOL`}
        </button>
        <div className="flex items-start gap-3 px-6 py-4 bg-primary/5 border border-primary/20 flex-1">
          <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">
            info
          </span>
          <p className="font-mono text-[11px] text-chess-muted leading-long uppercase tracking-normal">
            {!initialized
              ? "Reward configuration is not initialized."
              : paused
                ? "Reward claims are currently paused."
                : claimablePoints > 0
                  ? `${claimablePoints} puzzle points are ready to mint as ZOL.`
                  : "All accrued puzzle points have been claimed."}
          </p>
        </div>
      </div>
    </div>
  );
}
