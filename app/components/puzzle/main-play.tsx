"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

import { Puzzle } from "@/services/puzzle.ts/puzzle.types";
import { getRandomPuzzles } from "@/services/puzzle.ts";
import { showToast } from "@/lib/toast";
import {
  useChessMoves,
  type PlayedMove,
} from "@/lib/hooks/use-chess-moves";
import { catchErr } from "@/utils/error-handlers";
import { usePuzzleStore } from "@/state/puzzle";
import { useAuthStore } from "@/state/auth";
import { difficultyLabel } from "@/utils/resolvers";
import { useSendTransaction } from "@/lib/hooks/use-send-transaction";

import { EngineLog, MoveEntry } from "../dashboard/engine-log";
import { ChessBoard } from "../chess/chess-board";
import { PuzzleActionBar } from "../dashboard/puzzle-action-bar";
import { TacticalDossier } from "../dashboard/tactical-dossier";
import { getSubmitPuzzleInstructionAsync } from "@/generated/zol_chess_program";
import { TransactionSigner } from "@solana/kit";

function uciToLabel(uci: string): string {
  return `${uci.slice(0, 2).toUpperCase()}→${uci.slice(2, 4).toUpperCase()}`;
}

function appendPlayedMove(
  entries: MoveEntry[],
  playedMove: PlayedMove,
): MoveEntry[] {
  const nextEntries = entries.map((entry) => ({ ...entry, active: false }));
  const entryIndex = nextEntries.findIndex(
    (entry) =>
      entry.number === playedMove.moveNumber && !entry.white.startsWith("["),
  );
  const label = playedMove.san;

  if (entryIndex >= 0) {
    const entry = nextEntries[entryIndex]!;
    nextEntries[entryIndex] = {
      ...entry,
      white: playedMove.color === "w" ? label : entry.white,
      black: playedMove.color === "b" ? label : entry.black,
      active: true,
    };
    return nextEntries;
  }

  nextEntries.push({
    number: playedMove.moveNumber,
    white: playedMove.color === "w" ? label : "_",
    black: playedMove.color === "b" ? label : undefined,
    active: true,
  });
  return nextEntries;
}

interface MainPlayProps {
  signer?: TransactionSigner;
  puzzle: Puzzle | null;
  isLoading: boolean;
}

const MainPlay = ({ signer, puzzle, isLoading }: MainPlayProps) => {
  const router = useRouter();
  const encryptedPuzzles = usePuzzleStore((s) => s.encryptedPuzzles);
  const setPuzzles = usePuzzleStore((s) => s.updatePuzzleList);
  const user = useAuthStore((s) => s.user);
  const { send } = useSendTransaction();
  const { mutate } = useSWRConfig();

  const boardData = useMemo(() => {
    if (!puzzle?.moves?.length) return null;

    const [triggerUci, ...solutionMoves] = puzzle.moves;
    const from = triggerUci.slice(0, 2);
    const to = triggerUci.slice(2, 4);
    const chess = new Chess(puzzle.fen);

    let triggerMove;
    try {
      triggerMove = chess.move({ from, to, promotion: "q" });
    } catch {
      return null;
    }

    const playerSide = chess.turn();
    const playerColor = playerSide === "w" ? "WHITE" : "BLACK";
    const theme =
      puzzle.themes[0]
        ?.replace(/([A-Z])/g, " $1")
        .toUpperCase()
        .trim() ?? "TACTICS";
    const movesToWin = Math.ceil(solutionMoves.length / 2);

    return {
      fen: chess.fen(),
      lastMove: { from, to },
      solutionMoves,
      playerColor,
      objective: `${theme} IN ${movesToWin} // ${playerColor} TO MOVE`,
      threatLevel: difficultyLabel(puzzle.rating),
      initialLog: [
        {
          number: Number(triggerMove.before.split(" ")[5]),
          white: triggerMove.color === "w" ? triggerMove.san : "_",
          black: triggerMove.color === "b" ? triggerMove.san : undefined,
          active: true,
        },
      ] as MoveEntry[],
    };
  }, [puzzle]);

  const initialMoveLog = useMemo(
    () => boardData?.initialLog ?? [],
    [boardData]
  );
  const [startedAt] = useState(() => Date.now());
  const [moveLog, setMoveLog] = useState<MoveEntry[]>(initialMoveLog);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleIncorrectMove(move: string) {
    setMoveLog((prev) => {
      const attempt =
        prev.filter((entry) => entry.white.startsWith("[X]")).length + 1;
      return [
        ...prev,
        {
          number: prev.length + 1,
          white: `[X] ${uciToLabel(move)}`,
          black: `attempt_${attempt}`,
          active: true,
        },
      ];
    });
  }

  function handlePuzzleSolved() {
    setPuzzleSolved(true);
  }

  function handleMovePlayed(move: PlayedMove) {
    setMoveLog((prev) => appendPlayedMove(prev, move));
  }

  const {
    selected,
    chessPosition,
    lastMove,
    optionSquares,
    incorrectSquare,
    wrongMoveActive,
    opponentMovePending,
    hintSquare,
    getHint,
    resetPuzzle,
    retryMove,
    onPieceDrop,
    onSquareClick,
  } = useChessMoves(
    boardData?.fen ?? "",
    boardData?.solutionMoves ?? [],
    handleIncorrectMove,
    handlePuzzleSolved,
    handleMovePlayed,
    boardData?.lastMove
  );

  function handleGetHint() {
    const fromSquare = getHint();
    if (!fromSquare) {
      showToast(
        puzzleSolved ? "Puzzle already solved!" : "No hint available",
        "warning"
      );
      return;
    }
    setMoveLog((prev) => [
      ...prev,
      {
        number: prev.length + 1,
        white: `[?] HINT: ${fromSquare.toUpperCase()}`,
        active: true,
      },
    ]);
  }

  function handleReset() {
    resetPuzzle();
    setMoveLog(initialMoveLog);
    setPuzzleSolved(false);
  }

  async function goToNextPuzzle() {
    const currentIdx = encryptedPuzzles.findIndex(
      (p) => p.puzzleId === puzzle?.puzzleId || p.id === puzzle?.id
    );
    const next = encryptedPuzzles[currentIdx + 1];

    if (next) {
      router.push(`/puzzles/${next.id}`);
      return;
    }

    // No more puzzles in the list — fetch a fresh random batch
    try {
      const puzzles = await getRandomPuzzles(
        user?.player_rating ?? 800,
        5,
        signer?.address ?? ""
      );
      if (!puzzles.length) {
        showToast("No more puzzles available right now.", "warning");
        return;
      }
      setPuzzles(puzzles);
      router.push(`/puzzles/${puzzles[0].id}`);
    } catch (error) {
      showToast(
        catchErr(error).message ?? "Failed to load next puzzle.",
        "error"
      );
    }
  }

  async function handleCheckSolution() {
    if (!puzzle) return;

    if (!puzzleSolved) {
      showToast(
        "Complete the puzzle first — find the correct sequence of moves.",
        "warning"
      );
      return;
    }

    if (!signer) {
      showToast("Connect your wallet to submit.", "warning");
      return;
    }

    try {
      setSubmitting(true);

      const timeTaken = Math.floor((Date.now() - startedAt) / 1000);
      const incorrectCount = moveLog.filter((entry) =>
        entry.white.startsWith("[X]")
      ).length;

      if (!puzzle.solutionSignature) return;

      const sigBytes = Uint8Array.from(
        puzzle.solutionSignature.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
      );

      const ix = await getSubmitPuzzleInstructionAsync({
        authority: signer,
        puzzleId: puzzle.puzzleId,
        puzzleRating: puzzle.rating,
        timeTaken,
        solved: true,
        attempts: incorrectCount,
        solutionSignature: sigBytes,
      });

      await send({ instructions: [ix] });
      mutate((key: unknown) => Array.isArray(key) && key[0] === "chain-profile");

      showToast("Solution submitted! Loading next puzzle...", "success");
      setTimeout(() => goToNextPuzzle(), 1500);
    } catch (error) {
      showToast(
        catchErr(error).message ?? "Submission failed. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="ml-64 pt-24 px-8 pb-12 max-w-360 relative flex items-center justify-center min-h-screen">
        <span className="font-mono text-primary animate-pulse uppercase tracking-widest">
          LOADING PUZZLE...
        </span>
      </main>
    );
  }

  return (
    <main className="ml-64 pt-24 pl-4 pr-8 pb-12 max-w-360 relative">
      <div className="scanline" />

      {puzzleSolved && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 bg-primary text-chess-bg font-mono font-bold text-sm px-8 py-3 uppercase tracking-widest shadow-[0_0_30px_rgba(20,241,149,0.6)] animate-pulse">
          PUZZLE COMPLETED ✓
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="glass-panel neon-border p-6 w-full max-w-md max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-4">
              <h3 className="font-mono text-xs text-primary font-bold uppercase tracking-[0.2em]">
                Full Move History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="font-mono text-xs text-chess-muted hover:text-primary uppercase tracking-widest"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar space-y-2 font-mono text-xs text-chess-muted/70 flex-1">
              {moveLog.map((move, index) => (
                <div
                  key={`${move.number}-${move.white}-${index}`}
                  className={`flex gap-4 ${move.active ? "text-foreground" : ""}`}
                >
                  <span
                    className={`w-8 shrink-0 ${move.active ? "text-primary" : ""}`}
                  >
                    {String(move.number).padStart(2, "0")}.
                  </span>
                  <span
                    className={`w-32 shrink-0 ${move.active ? "font-bold" : ""}`}
                  >
                    {move.white}
                  </span>
                  <span>{move.black ?? "_"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 relative z-20">
        {/* ── Left column — board + actions (8 cols) ─────────── */}
        <div className="col-span-8 flex flex-col gap-6">
          {boardData?.fen && (
            <ChessBoard
              chessPosition={chessPosition}
              lastMove={lastMove}
              boardOrientation={
                boardData.playerColor === "BLACK" ? "black" : "white"
              }
              arePiecesDraggable={!opponentMovePending && !puzzleSolved}
              selected={selected}
              optionSquares={optionSquares}
              incorrectSquare={incorrectSquare}
              wrongMoveActive={wrongMoveActive}
              hintSquare={hintSquare}
              retryMove={retryMove}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
            />
          )}
          <PuzzleActionBar
            onHint={handleGetHint}
            onReset={handleReset}
            onAnalyze={handleCheckSolution}
            submitting={submitting}
            puzzleSolved={puzzleSolved}
          />
        </div>

        {/* ── Right column — dossier + logs (4 cols) ─────────── */}
        <div className="col-span-4 flex flex-col gap-6">
          <TacticalDossier
            puzzleId={puzzle ? `Puzzle #${puzzle.puzzleId}` : "—"}
            objective={boardData?.objective ?? "LOADING..."}
            threatLevel={boardData?.threatLevel ?? "—"}
            eloIndex={puzzle?.rating ?? 0}
            playerColor={boardData?.playerColor ?? null}
            walletSig="4aXz...9P1s"
            walletBalance="12.45 SOL"
          />
          <EngineLog
            moves={moveLog}
            onViewHistory={() => setShowHistory(true)}
          />
        </div>
      </div>
    </main>
  );
};

export default MainPlay;
