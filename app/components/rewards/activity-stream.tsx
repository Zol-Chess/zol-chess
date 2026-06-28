import type { PuzzleActivity } from "@/lib/hooks/use-rewards";

function resultClass(solved: boolean) {
  if (solved) {
    return "bg-primary/10 text-primary border-primary/30";
  }

  return "bg-destructive/10 text-destructive border-destructive/30";
}

export function ActivityStream({ entries }: { entries: PuzzleActivity[] }) {
  return (
    <div className="lg:col-span-8 glass-panel overflow-hidden flex flex-col border border-primary/30 shadow-[0_0_15px_rgba(20,241,149,0.1),inset_0_0_10px_rgba(20,241,149,0.05)]">
      <div className="p-4 sm:p-6 border-b border-primary/20 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-primary/5">
        <h3 className="font-mono text-xs uppercase tracking-normal sm:tracking-[0.2em] text-foreground flex items-center gap-2 leading-short">
          <span className="w-2 h-2 bg-primary rounded-full" />
          Historical Log Stream
        </h3>
        <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
          <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-[10px] text-primary font-mono uppercase leading-short">
            Source: Player PDA
          </span>
          <span className="material-symbols-outlined text-chess-muted cursor-pointer hover:text-primary transition-colors">
            tune
          </span>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-140 sm:min-w-155">
          <thead className="bg-chess-container-hi/50 text-chess-muted font-mono text-[10px] uppercase tracking-widest border-b border-primary/10">
            <tr>
              <th className="px-6 py-4 font-medium">PUZZLE ID</th>
              <th className="px-6 py-4 font-medium">TIMESTAMP</th>
              <th className="px-6 py-4 font-medium">RESULT</th>
              <th className="px-6 py-4 font-medium text-right">PERFORMANCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {entries.map((entry, index) => (
              <tr
                key={`${entry.puzzleId}-${entry.timestamp.getTime()}-${index}`}
                className={`transition-colors cursor-pointer ${
                  index % 2 === 0 ? "hover:bg-primary/5" : "hover:bg-primary/10"
                }`}
              >
                <td className="px-6 py-4 font-mono text-xs text-primary leading-short">
                  {entry.puzzleId}
                </td>
                <td className="px-6 py-4 text-[11px] font-mono text-chess-muted uppercase leading-short">
                  {entry.timestamp.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[9px] px-2 py-0.5 uppercase font-bold border tracking-widest ${resultClass(
                      entry.solved
                    )}`}
                  >
                    {entry.solved ? "SOLVED" : "FAILED"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-primary text-sm leading-short">
                  {entry.timeTaken}s / {entry.attempts} attempts
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center font-mono text-xs uppercase text-chess-muted"
                >
                  No on-chain puzzle history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-primary/5 flex justify-center border-t border-primary/10">
        <div className="text-primary font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 leading-short">
          <span className="material-symbols-outlined text-sm">history</span>
          Latest {entries.length} Onchain Records
        </div>
      </div>
    </div>
  );
}
