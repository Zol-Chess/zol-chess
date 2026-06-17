import { Chess, Square } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

// Fallback so new Chess() never throws before a real FEN arrives
const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function useChessMoves(
  fen: string,
  solutionMoves: string[] = [],
  onIncorrectMove?: (move: string) => void,
  onPuzzleSolved?: () => void
) {
  const chessGameRef = useRef(new Chess(fen || INITIAL_FEN));
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Puzzle state
  // Ref so attemptMove always reads the latest index without stale closures
  const currentMoveIndexRef = useRef(0);
  const [incorrectSquare, setIncorrectSquare] = useState<string | null>(null);
  // True while a wrong move is on the board waiting for the user to retry
  const [wrongMoveActive, setWrongMoveActive] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const isPuzzleMode = solutionMoves.length > 0;

  // Keep callbacks stable across renders
  const onIncorrectMoveRef = useRef(onIncorrectMove);
  const onPuzzleSolvedRef = useRef(onPuzzleSolved);
  onIncorrectMoveRef.current = onIncorrectMove;
  onPuzzleSolvedRef.current = onPuzzleSolved;

  useEffect(() => {
    if (!fen) return;
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    chessGame.load(fen);
    setChessPosition(fen);
    setMoveFrom("");
    setSelected(null);
    setOptionSquares({});
    currentMoveIndexRef.current = 0;
    setIncorrectSquare(null);
    setWrongMoveActive(false);
    setPuzzleSolved(false);
    setHintSquare(null);
  }, [fen]);

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
    if (wrongMoveActive) return false;

    try {
      chessGame.move({ from, to, promotion: "q" });
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
        const nextIdx = idx + 1;

        if (nextIdx >= solutionMoves.length) {
          currentMoveIndexRef.current = nextIdx;
          setPuzzleSolved(true);
          onPuzzleSolvedRef.current?.();
          return true;
        }

        // Auto-play opponent's forced response after a short delay
        const opponentUCI = solutionMoves[nextIdx];
        currentMoveIndexRef.current = nextIdx + 1;

        setTimeout(() => {
          try {
            chessGame.move({
              from: opponentUCI.slice(0, 2),
              to: opponentUCI.slice(2, 4),
            });
            setChessPosition(chessGame.fen());
          } catch {
            // Opponent move in solution definition is invalid — skip it
          }
        }, 250);

        return true;
      }

      // Wrong move — show it on the board and wait for user to retry
      setIncorrectSquare(to);
      setWrongMoveActive(true);
      setChessPosition(chessGame.fen());
      onIncorrectMoveRef.current?.(playedUCI);
      return true;
    }

    setChessPosition(chessGame.fen());
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
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    chessGame.load(fen);
    setChessPosition(fen);
    setMoveFrom("");
    setSelected(null);
    setOptionSquares({});
    currentMoveIndexRef.current = 0;
    setIncorrectSquare(null);
    setWrongMoveActive(false);
    setPuzzleSolved(false);
    setHintSquare(null);
  }

  // Undoes the wrong move and resets to the pre-attempt position
  function retryMove() {
    chessGame.undo();
    setChessPosition(chessGame.fen());
    setIncorrectSquare(null);
    setWrongMoveActive(false);
    setMoveFrom("");
    setSelected(null);
    setOptionSquares({});
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (wrongMoveActive) return;

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
    if (!targetSquare || wrongMoveActive) return false;
    return attemptMove(sourceSquare, targetSquare);
  }

  return {
    selected,
    chessPosition,
    chessGameRef,
    moveFrom,
    optionSquares,
    incorrectSquare,
    wrongMoveActive,
    puzzleSolved,
    hintSquare,
    getHint,
    resetPuzzle,
    retryMove,
    onPieceDrop,
    onSquareClick,
  };
}
