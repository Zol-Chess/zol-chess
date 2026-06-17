"use client";

type PuzzleActionBarProps = {
  onHint?: () => void;
  onReset?: () => void;
  onAnalyze?: () => void;
  submitting?: boolean;
  puzzleSolved?: boolean;
};

export function PuzzleActionBar({
  onHint,
  onReset,
  onAnalyze,
  submitting,
  puzzleSolved,
}: PuzzleActionBarProps) {
  return (
    <div className="flex items-center justify-between glass-panel p-4 neon-border max-w-150 mx-auto w-full">
      <div className="flex gap-4">
        <button
          onClick={onHint}
          disabled={puzzleSolved}
          className="px-6 py-2 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/10 transition-all uppercase tracking-widest leading-short disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Get Hint
        </button>
        <button
          onClick={onReset}
          disabled={submitting}
          className="px-6 py-2 border border-chess-muted/30 text-chess-muted font-mono text-xs hover:bg-chess-container transition-all uppercase tracking-widest leading-short disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset Puzzle
        </button>
      </div>

      <button
        onClick={onAnalyze}
        disabled={submitting}
        className="px-8 py-2 bg-primary text-chess-bg font-mono text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 uppercase tracking-widest shadow-[0_0_15px_rgba(20,241,149,0.3)] leading-short disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-sm">query_stats</span>
        {submitting ? "Submitting..." : "Submit Solution"}
      </button>
    </div>
  );
}
