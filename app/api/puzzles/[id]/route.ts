import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import { encryptSolution, signSolution } from "@/script/encrypt-solution";
import { getAttemptedPuzzleIds } from "@/lib/server/attempted-puzzles";
import { catchErr } from "@/utils/error-handlers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const playerPubkey = searchParams.get("player") ?? "";
  const cluster = searchParams.get("cluster");

  try {
    const client = await clientPromise;
    const collection = client.db("chess").collection("puzzles");

    let puzzle = await collection.findOne({ puzzleId: id });

    if (!puzzle) {
      try {
        puzzle = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        // id is not a valid ObjectId — puzzle simply not found
      }
    }

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    // If the player already attempted/solved this exact puzzle (e.g. a
    // stale bookmark or browser back-button), quietly swap in a fresh one
    // from the same rating neighborhood instead of re-serving it.
    const attemptedIds = await getAttemptedPuzzleIds(playerPubkey, cluster);
    if (attemptedIds.includes(puzzle.puzzleId)) {
      const rating = puzzle.rating as number;
      const [replacement] = await collection
        .aggregate([
          {
            $match: {
              rating: { $gte: rating - 50, $lte: rating + 50 },
              puzzleId: { $nin: attemptedIds },
            },
          },
          { $sample: { size: 1 } },
        ])
        .toArray();

      if (replacement) puzzle = replacement as NonNullable<typeof puzzle>;
    }

    const { _id, moves, ...rest } = puzzle;
    const movesJson = JSON.stringify(moves);
    const puzzleId = rest.puzzleId as string;

    const encrypted = await encryptSolution(movesJson, puzzleId);
    const signature = await signSolution(puzzleId, playerPubkey);

    return NextResponse.json({
      id: _id.toString(),
      ...rest,
      encryptedSolution: encrypted
        ? { iv: encrypted.iv, data: encrypted.data }
        : null,
      solutionKey: encrypted?.keyHex ?? null,
      solutionSignature: signature,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch puzzle" },
      { status: 500 }
    );
  }
}
