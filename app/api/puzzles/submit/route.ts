import { NextRequest, NextResponse } from "next/server";

import { clientPromise } from "@/lib/mongodb";
import { verifySolution } from "@/script/encrypt-solution";
import { catchErr } from "@/utils/error-handlers";

// POST /api/puzzles/submit
// Body: { puzzleId: string; signature: string }
// Fetches the original moves from DB, re-derives the HMAC, and verifies
// the signature matches — proving the solution was issued by this server.
export async function POST(req: NextRequest) {
  try {
    const { puzzleId, signature } = (await req.json()) as {
      puzzleId?: string;
      signature?: string;
    };

    if (!puzzleId || !signature) {
      return NextResponse.json(
        { error: "puzzleId and signature are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const collection = client.db("chess").collection("puzzles");
    const puzzle = await collection.findOne({ puzzleId });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const movesJson = JSON.stringify(puzzle.moves);
    const valid = await verifySolution(movesJson, puzzleId, signature);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid solution signature" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(catchErr(error));
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
