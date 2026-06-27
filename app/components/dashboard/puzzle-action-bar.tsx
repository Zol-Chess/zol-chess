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
    <div className="flex flex-col gap-3 glass-panel p-3 sm:p-4 neon-border w-full lg:max-w-[calc(100vh-15rem)] lg:mx-auto sm:flex-row sm:items-center sm:justify-between">
      <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
        <button
          onClick={onHint}
          disabled={puzzleSolved}
          className="px-3 py-2 border border-primary/30 text-primary font-mono text-[11px] hover:bg-primary/10 transition-all uppercase tracking-normal leading-short disabled:opacity-40 disabled:cursor-not-allowed sm:px-6 sm:text-xs sm:tracking-widest"
        >
          Get Hint
        </button>
        <button
          onClick={onReset}
          disabled={submitting}
          className="px-3 py-2 border border-chess-muted/30 text-chess-muted font-mono text-[11px] hover:bg-chess-container transition-all uppercase tracking-normal leading-short disabled:opacity-40 disabled:cursor-not-allowed sm:px-6 sm:text-xs sm:tracking-widest"
        >
          Reset Puzzle
        </button>
      </div>

      <button
        onClick={onAnalyze}
        disabled={submitting}
        className="px-4 py-3 bg-primary text-chess-bg font-mono text-[11px] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase tracking-normal shadow-[0_0_15px_rgba(20,241,149,0.3)] leading-short disabled:opacity-60 disabled:cursor-not-allowed sm:px-8 sm:py-2 sm:text-xs sm:tracking-widest"
      >
        <span className="material-symbols-outlined text-sm">query_stats</span>
        {submitting ? "Submitting..." : "Submit Solution"}
      </button>
    </div>
  );
}
