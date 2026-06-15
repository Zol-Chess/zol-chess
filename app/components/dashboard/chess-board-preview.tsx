const BOARD_SIZE = 8;

export function ChessBoardPreview() {
  const squares = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;
    return (row + col) % 2 === 0;
  });

  return (
    <div className="aspect-square w-full bg-board-dark rounded-sm relative mb-6 overflow-hidden border border-primary/20 group cursor-crosshair">
      <div className="grid grid-cols-8 grid-rows-8 h-full w-full opacity-60">
        {squares.map((isLight, i) => (
          <div
            key={i}
            className={isLight ? "bg-board-light" : "bg-board-dark"}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span
            className="material-symbols-outlined text-primary drop-shadow-[0_0_20px_rgba(20,241,149,0.5)]"
            style={{ fontSize: 80, fontVariationSettings: "'FILL' 1" }}
          >
            castle
          </span>
          <span className="font-mono text-xs bg-black/80 text-primary px-4 py-1 border border-primary/40 uppercase tracking-widest mt-4 leading-short">
            Black_To_Move
          </span>
        </div>
      </div>
    </div>
  );
}
