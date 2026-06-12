import { NextResponse } from "next/server";
import { getPuzzle, getOrCreateSession, saveSession } from "@/app/lib/chess/puzzle-store";
import { validateMove } from "@/app/lib/chess/puzzle";

type Params = { params: Promise<{ id: string }> };

// POST /api/puzzles/:id/attempt
// body: { walletAddress: string, move: string }  (move in UCI notation e.g. "e2e4")
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { walletAddress, move } = await req.json();

  const puzzle = getPuzzle(id);
  if (!puzzle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = getOrCreateSession(walletAddress, id);
  const result = validateMove(puzzle, session, move);

  if (result.outcome === "correct") {
    session.stepIndex = result.stepIndex;
    session.solved = result.solved;
    saveSession(session);

    // TODO: if result.solved && puzzle.wagerLamports > 0 → trigger Anchor payout
  }

  if (result.outcome === "wrong") {
    session.failed = true;
    saveSession(session);
  }

  return NextResponse.json(result);
}
