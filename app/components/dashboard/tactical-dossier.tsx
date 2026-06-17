import { GlassPanel } from "./glass-panel";
import { SectionHeader } from "./section-header";

function SolanaIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 397 311"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zM332.3 120.9c2.4-2.4 5.7-3.8 9.2-3.8H24c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

type TacticalDossierProps = {
  puzzleId: string;
  objective: string;
  threatLevel: string;
  eloIndex: number;
  solReward: string;
  walletSig: string;
  walletBalance: string;
};

export function TacticalDossier({
  puzzleId,
  objective,
  threatLevel,
  eloIndex,
  solReward,
  walletSig,
  walletBalance,
}: TacticalDossierProps) {
  const activeMissionBadge = (
    <span className="bg-primary/10 px-2 py-0.5 border border-primary/30 text-primary font-mono text-xs uppercase tracking-widest animate-pulse leading-short">
      ACTIVE
    </span>
  );

  return (
    <GlassPanel className="p-6 flex flex-col">
      <SectionHeader title="Puzzle Details" badge={activeMissionBadge} />

      {/* Puzzle identity */}
      <div className="mb-6">
        <h3
          className="text-h6 font-bold text-foreground uppercase mb-1 leading-short"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          {puzzleId}
        </h3>
        <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] leading-short">
          {objective}
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-4 font-mono mb-8">
        <div className="flex justify-between items-center py-2 border-b border-primary/10">
          <span className="text-chess-muted text-xs uppercase tracking-widest leading-short">
            Difficulty
          </span>
          <span className="text-sm text-primary font-bold glow-text-green leading-short">
            {threatLevel}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-primary/10">
          <span className="text-chess-muted text-xs uppercase tracking-widest leading-short">
            Puzzle Rating
          </span>
          <span className="text-sm text-foreground font-bold leading-short">
            {eloIndex}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-primary/10">
          <span className="text-chess-muted text-xs uppercase tracking-widest leading-short">
            Win Reward
          </span>
          <div className="flex items-center gap-1 text-primary">
            <SolanaIcon className="w-3 h-3" />
            <span className="text-sm font-bold leading-short">{solReward}</span>
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-chess-container p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-primary/30">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <div>
              <p className="text-xs text-chess-muted font-mono uppercase tracking-tighter leading-short">
                Connected Wallet
              </p>
              <p className="text-primary font-bold font-mono text-sm leading-short">
                SIG: {walletSig}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-primary text-sm">
            verified
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
