import { GlassPanel } from "./glass-panel";

export type MoveEntry = {
  number: number;
  white: string;
  black?: string;
  active?: boolean;
};

type EngineLogProps = {
  moves: MoveEntry[];
  onViewHistory?: () => void;
};

export function EngineLog({ moves, onViewHistory }: EngineLogProps) {
  return (
    <GlassPanel className="flex flex-col grow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary/20 flex justify-between items-center bg-primary/5 shrink-0">
        <h3 className="font-mono text-xs text-primary font-bold uppercase tracking-[0.2em] leading-short">
          Move History
        </h3>
        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
      </div>

      {/* Move list */}
      <div className="p-6 flex-1 min-h-0 font-mono text-xs space-y-2 overflow-y-auto max-h-72 custom-scrollbar text-chess-muted/70">
        {moves.map((move, index) => (
          <div
            key={`${move.number}-${move.white}-${index}`}
            className={`flex gap-4 ${
              move.active ? "bg-primary/10 py-1 -mx-2 px-2 text-foreground" : ""
            }`}
          >
            <span
              className={`w-8 shrink-0 ${move.active ? "text-primary" : ""}`}
            >
              {String(move.number).padStart(2, "0")}.
            </span>
            <span className={`w-12 shrink-0 ${move.active ? "font-bold" : ""}`}>
              {move.white}
            </span>
            <span className={move.active ? "animate-pulse" : ""}>
              {move.black ?? "_"}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 bg-primary/5 border-t border-primary/10 flex justify-center shrink-0">
        <button
          onClick={onViewHistory}
          className="text-primary font-mono text-xs uppercase hover:underline tracking-widest leading-short"
        >
          View History
        </button>
      </div>
    </GlassPanel>
  );
}
