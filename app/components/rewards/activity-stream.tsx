import type { RewardActivity } from "./models";
import { rewardActivity } from "./models";

function threatClass(threatLevel: RewardActivity["threatLevel"]) {
  if (threatLevel === "Grandmaster") {
    return "bg-destructive/10 text-destructive border-destructive/30";
  }

  if (threatLevel === "Expert") {
    return "bg-primary/10 text-primary border-primary/30";
  }

  return "bg-primary/10 text-primary border-primary/30";
}

export function ActivityStream() {
  return (
    <div className="lg:col-span-8 glass-panel overflow-hidden flex flex-col border border-primary/30 shadow-[0_0_15px_rgba(20,241,149,0.1),inset_0_0_10px_rgba(20,241,149,0.05)]">
      <div className="p-6 border-b border-primary/20 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-primary/5">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground flex items-center gap-2 leading-short">
          <span className="w-2 h-2 bg-primary rounded-full" />
          Historical_Log_Stream
        </h3>
        <div className="flex gap-4 items-center">
          <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-[10px] text-primary font-mono uppercase leading-short">
            Scope: Devnet
          </span>
          <span className="material-symbols-outlined text-chess-muted cursor-pointer hover:text-primary transition-colors">
            tune
          </span>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead className="bg-chess-container-hi/50 text-chess-muted font-mono text-[10px] uppercase tracking-widest border-b border-primary/10">
            <tr>
              <th className="px-6 py-4 font-medium">PUZZLE_ID</th>
              <th className="px-6 py-4 font-medium">TIMESTAMP</th>
              <th className="px-6 py-4 font-medium">THREAT_LVL</th>
              <th className="px-6 py-4 font-medium text-right">CREDIT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {rewardActivity.map((entry, index) => (
              <tr
                key={entry.puzzleId}
                className={`transition-colors cursor-pointer ${
                  index % 2 === 0
                    ? "hover:bg-primary/5"
                    : "hover:bg-primary/10"
                }`}
              >
                <td className="px-6 py-4 font-mono text-xs text-primary leading-short">
                  {entry.puzzleId}
                </td>
                <td className="px-6 py-4 text-[11px] font-mono text-chess-muted uppercase leading-short">
                  {entry.timestamp}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[9px] px-2 py-0.5 uppercase font-bold border tracking-widest ${threatClass(
                      entry.threatLevel
                    )}`}
                  >
                    {entry.threatLevel}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-primary text-sm leading-short">
                  {entry.credit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-primary/5 flex justify-center border-t border-primary/10">
        <button className="text-primary font-mono text-[11px] uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2 leading-short">
          <span className="material-symbols-outlined text-sm">history</span>
          Fetch_More_History
        </button>
      </div>
    </div>
  );
}
