import { rewardSummary } from "./models";

export function RewardsTotalCard() {
  return (
    <div className="lg:col-span-8 glass-panel neon-border p-8 flex flex-col justify-between overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-[120px]">
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
        <h1 className="font-display text-[clamp(2.75rem,6vw,4rem)] text-foreground flex items-baseline gap-4 leading-none">
          {rewardSummary.totalSol}
          <span className="text-primary text-xl font-bold tracking-normal">
            SOL
          </span>
        </h1>
        <div className="flex items-center gap-2 mt-4">
          <p className="text-chess-muted font-mono text-xs leading-short">
            EST_VAL:
          </p>
          <p className="text-primary font-mono text-xs font-bold leading-short">
            {rewardSummary.estimatedUsd}
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row gap-6 items-stretch md:items-center">
        <button className="bg-primary text-chess-bg px-10 py-5 font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 hover:shadow-[0_0_25px_rgba(20,241,149,0.4)] active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined">terminal</span>
          EXECUTE_CLAIM
        </button>
        <div className="flex items-start gap-3 px-6 py-4 bg-primary/5 border border-primary/20 flex-1">
          <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">
            info
          </span>
          <p className="font-mono text-[11px] text-chess-muted leading-long uppercase tracking-normal">
            {rewardSummary.settlementStatus}
          </p>
        </div>
      </div>
    </div>
  );
}
