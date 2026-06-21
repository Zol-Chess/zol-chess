import { Chess, Square } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

// Fallback so new Chess() never throws before a real FEN arrives
const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export type PlayedMove = {
  color: "w" | "b";
  from: string;
  to: string;
  san: string;
  moveNumber: number;
  actor: "player" | "computer";
};

export function useChessMoves(
  fen: string,
  solutionMoves: string[] = [],
  onIncorrectMove?: (move: string) => void,
  onPuzzleSolved?: () => void,
  onMovePlayed?: (move: PlayedMove) => void,
  initialLastMove?: { from: string; to: string }
) {
  const [chessGame] = useState(() => new Chess(fen || INITIAL_FEN));
  const chessGameRef = useRef(chessGame);

  const [chessPosition, setChessPosition] = useState(fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [lastMove, setLastMove] = useState(initialLastMove);
  const lastMoveRef = useRef(initialLastMove);
  const previousLastMoveRef = useRef(initialLastMove);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Puzzle state
  // Ref so attemptMove always reads the latest index without stale closures
  const currentMoveIndexRef = useRef(0);
  const [incorrectSquare, setIncorrectSquare] = useState<string | null>(null);
  // True while a wrong move is on the board waiting for the user to retry
  const [wrongMoveActive, setWrongMoveActive] = useState(false);
  const [opponentMovePending, setOpponentMovePending] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const isPuzzleMode = solutionMoves.length > 0;

  function resetInternalState() {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (opponentMoveTimerRef.current)
      clearTimeout(opponentMoveTimerRef.current);
    chessGame.load(fen || INITIAL_FEN);
    setChessPosition(fen);
    setMoveFrom("");
    setSelected(null);
    setOptionSquares({});
    currentMoveIndexRef.current = 0;
    setIncorrectSquare(null);
    setWrongMoveActive(false);
    setOpponentMovePending(false);
    setPuzzleSolved(false);
    setHintSquare(null);
    setLastMove(initialLastMove);
    lastMoveRef.current = initialLastMove;
    previousLastMoveRef.current = initialLastMove;
  }

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (opponentMoveTimerRef.current) {
        clearTimeout(opponentMoveTimerRef.current);
      }
    };
  }, []);

  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({ square, verbose: true });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};

    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }

    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  }

  function attemptMove(from: string, to: string): boolean {
    if (wrongMoveActive || opponentMovePending) return false;

    let playedMove;
    try {
      previousLastMoveRef.current = lastMoveRef.current;
      playedMove = chessGame.move({ from, to, promotion: "q" });
      setLastMove({ from, to });
      lastMoveRef.current = { from, to };
    } catch {
      return false; // chess-illegal move
    }

    if (isPuzzleMode) {
      const playedUCI = `${from}${to}`;
      // Read from ref so this is always the current index, never stale
      const idx = currentMoveIndexRef.current;
      const expectedUCI = solutionMoves[idx];

      if (playedUCI === expectedUCI) {
        setChessPosition(chessGame.fen());
        onMovePlayed?.({
          color: playedMove.color,
          from,
          to,
          san: playedMove.san,
          moveNumber: Number(playedMove.before.split(" ")[5]),
          actor: "player",
        });
        const nextIdx = idx + 1;

        if (nextIdx >= solutionMoves.length) {
          currentMoveIndexRef.current = nextIdx;
          setPuzzleSolved(true);
          onPuzzleSolved?.();
          return true;
        }

        // Auto-play opponent's forced response after a short delay
        const opponentUCI = solutionMoves[nextIdx];
        currentMoveIndexRef.current = nextIdx + 1;
        setOpponentMovePending(true);

        opponentMoveTimerRef.current = setTimeout(() => {
          try {
            const opponentFrom = opponentUCI.slice(0, 2);
            const opponentTo = opponentUCI.slice(2, 4);
            const opponentMove = chessGame.move({
              from: opponentFrom,
              to: opponentTo,
              promotion: "q",
            });
            setChessPosition(chessGame.fen());
            setLastMove({ from: opponentFrom, to: opponentTo });
            lastMoveRef.current = {
              from: opponentFrom,
              to: opponentTo,
            };
            onMovePlayed?.({
              color: opponentMove.color,
              from: opponentFrom,
              to: opponentTo,
              san: opponentMove.san,
              moveNumber: Number(opponentMove.before.split(" ")[5]),
              actor: "computer",
            });
          } catch {
            // Opponent move in solution definition is invalid — skip it
          } finally {
            setOpponentMovePending(false);
          }
        }, 250);

        return true;
      }

      // Wrong move — show it on the board and wait for user to retry
      setIncorrectSquare(to);
      setWrongMoveActive(true);
      setChessPosition(chessGame.fen());
      onIncorrectMove?.(playedUCI);
      return true;
    }

    setChessPosition(chessGame.fen());
    onMovePlayed?.({
      color: playedMove.color,
      from,
      to,
      san: playedMove.san,
      moveNumber: Number(playedMove.before.split(" ")[5]),
      actor: "player",
    });
    return true;
  }

  function getHint(): string | null {
    const idx = currentMoveIndexRef.current;
    if (puzzleSolved || idx >= solutionMoves.length) return null;
    const fromSquare = solutionMoves[idx].slice(0, 2);
    setHintSquare(fromSquare);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintSquare(null), 2500);
    return fromSquare;
  }

  function resetPuzzle() {
    resetInternalState();
  }

  // Undoes the wrong move and resets to the pre-attempt position
  function retryMove() {
    chessGame.undo();
    setChessPosition(chessGame.fen());
    setLastMove(previousLastMoveRef.current);
    lastMoveRef.current = previousLastMoveRef.current;
    setIncorrectSquare(null);
    setWrongMoveActive(false);
    setMoveFrom("");
    setSelected(null);
    setOptionSquares({});
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (wrongMoveActive || opponentMovePending) return;

    if (!moveFrom) {
      if (!piece) return;
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) {
        setMoveFrom(square);
        setSelected(square);
      }
      return;
    }

    const success = attemptMove(moveFrom, square);
    setMoveFrom("");
    setSelected(null);
    setOptionSquares({});

    if (!success && piece) {
      // Chess-illegal destination — let them pick a different piece
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) {
        setMoveFrom(square);
        setSelected(square);
      }
    }
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare || wrongMoveActive || opponentMovePending) return false;
    return attemptMove(sourceSquare, targetSquare);
  }

  return {
    selected,
    chessPosition,
    chessGameRef,
    moveFrom,
    optionSquares,
    lastMove,
    incorrectSquare,
    wrongMoveActive,
    opponentMovePending,
    puzzleSolved,
    hintSquare,
    getHint,
    resetPuzzle,
    retryMove,
    onPieceDrop,
    onSquareClick,
  };
}
