import { GlassPanel } from "./glass-panel";
import { SectionHeader } from "./section-header";

type TacticalDossierProps = {
  puzzleId: string;
  objective: string;
  threatLevel: string;
  eloIndex: number;
  playerColor: string | null;
  walletSig: string;
  walletBalance: string;
};

export function TacticalDossier({
  puzzleId,
  objective,
  threatLevel,
  eloIndex,
  playerColor,
  walletSig,
  walletBalance,
}: TacticalDossierProps) {
  const activeMissionBadge = (
    <span className="bg-primary/10 px-2 py-0.5 border border-primary/30 text-primary font-mono text-xs uppercase tracking-widest animate-pulse leading-short">
      ACTIVE
    </span>
  );

  return (
    <GlassPanel className="p-5 sm:p-6 flex flex-col">
      <SectionHeader title="Puzzle Details" badge={activeMissionBadge} />

      {/* Puzzle identity */}
      <div className="mb-6">
        <h3
          className="text-h6 font-bold text-foreground uppercase mb-1 leading-short"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          {puzzleId}
        </h3>
        <p className="font-mono text-xs text-primary uppercase tracking-normal sm:tracking-[0.2em] leading-short break-words">
          {objective}
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-4 font-mono mb-8">
        <div className="flex justify-between items-center gap-4 py-2 border-b border-primary/10">
          <span className="text-chess-muted text-xs uppercase tracking-widest leading-short">
            Difficulty
          </span>
          <span className="text-sm text-primary font-bold glow-text-green leading-short">
            {threatLevel}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4 py-2 border-b border-primary/10">
          <span className="text-chess-muted text-xs uppercase tracking-widest leading-short">
            Puzzle Rating
          </span>
          <span className="text-sm text-foreground font-bold leading-short">
            {eloIndex}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4 py-2 border-b border-primary/10">
          <span className="text-chess-muted text-xs uppercase tracking-widest leading-short">
            Player Color
          </span>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 border ${
                playerColor === "WHITE"
                  ? "bg-white border-primary/40"
                  : "bg-chess-bg border-primary/40"
              }`}
            />
            <span className="text-sm text-primary font-bold leading-short">
              {playerColor ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-chess-container p-4 border border-primary/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-primary/30">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-chess-muted font-mono uppercase tracking-tighter leading-short">
                Connected Wallet
              </p>
              <p className="text-primary font-bold font-mono text-sm leading-short truncate">
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
