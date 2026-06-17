"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { ChessboardOptions, PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full bg-[#1b1b25] animate-pulse" />
    ),
  }
);

type ChessBoardProps = {
  chessPosition: string;
  lastMove?: { from: string; to: string };
  arePiecesDraggable?: boolean;
  selected?: string | null;
  incorrectSquare?: string | null;
  wrongMoveActive?: boolean;
  hintSquare?: string | null;
  retryMove?: () => void;
  onPieceDrop?: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick?: (args: SquareHandlerArgs) => void;
};

export function ChessBoard({
  chessPosition,
  lastMove,
  arePiecesDraggable = true,
  selected,
  incorrectSquare,
  wrongMoveActive,
  hintSquare,
  retryMove,
  onPieceDrop,
  onSquareClick,
}: ChessBoardProps) {
  const perSquareStyles: Record<string, CSSProperties> = {};

  if (selected) {
    perSquareStyles[selected] = {
      backgroundColor: "rgba(20, 241, 149, 0.3)",
      boxShadow: "inset 0 0 0 4px rgba(20, 241, 149, 0.9)",
    };
  }

  if (lastMove?.from) {
    perSquareStyles[lastMove.from] = {
      backgroundColor: "rgba(20, 241, 149, 0.12)",
      boxShadow: "inset 0 0 0 2px rgba(20, 241, 149, 0.5)",
    };
  }

  if (lastMove?.to) {
    perSquareStyles[lastMove.to] = {
      backgroundColor: "rgba(20, 241, 149, 0.2)",
      boxShadow: "inset 0 0 0 2px rgba(20, 241, 149, 0.6)",
    };
  }

  if (incorrectSquare) {
    perSquareStyles[incorrectSquare] = {
      backgroundColor: "rgba(239, 68, 68, 0.35)",
      boxShadow: "inset 0 0 0 4px rgba(239, 68, 68, 0.9)",
    };
  }

  if (hintSquare) {
    perSquareStyles[hintSquare] = {
      backgroundColor: "rgba(255, 200, 0, 0.4)",
      boxShadow: "inset 0 0 0 4px rgba(255, 200, 0, 0.9)",
    };
  }

  const boardOptions: ChessboardOptions = {
    position: chessPosition,
    allowDragging: arePiecesDraggable,
    onSquareClick,
    onPieceDrop,
    squareStyles: perSquareStyles,
    darkSquareStyle: { backgroundColor: "#312e2b" },
    lightSquareStyle: { backgroundColor: "#393844" },
    boardStyle: { borderRadius: "0", border: "none" },
  };

  return (
    <div className="glass-panel p-4 neon-border max-w-150 mx-auto w-full relative">
      <div className="corner-accent corner-tl" />
      <div className="corner-accent corner-tr" />
      <div className="corner-accent corner-bl" />
      <div className="corner-accent corner-br" />

      <Chessboard options={boardOptions} />

      {wrongMoveActive && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between bg-red-950/90 border border-red-500/50 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="font-mono text-xs text-red-400 uppercase tracking-widest">
              INVALID_SEQUENCE
            </span>
          </div>
          <button
            onClick={retryMove}
            className="font-mono text-xs text-red-300 border border-red-500/60 px-4 py-1 hover:bg-red-500/20 transition-all uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
