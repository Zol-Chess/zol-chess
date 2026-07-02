import { NextRequest, NextResponse } from "next/server";

import { clientPromise } from "@/lib/mongodb";
import { encryptSolution, signSolution } from "@/script/encrypt-solution";
import { getAttemptedPuzzleIds } from "@/lib/server/attempted-puzzles";
import { catchErr } from "@/utils/error-handlers";

// Prevent Next.js from caching this route so $sample returns different puzzles each time
export const dynamic = "force-dynamic";

const RATING_BAND = 50;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rating = Number(searchParams.get("rating") ?? 800);
  const count = Number(searchParams.get("count") ?? 5);
  const playerPubkey = searchParams.get("player") ?? "";
  const cluster = searchParams.get("cluster");

  try {
    const client = await clientPromise;
    const collection = client.db("chess").collection("puzzles");
    const attemptedIds = await getAttemptedPuzzleIds(playerPubkey, cluster);
    const excludeMatch = attemptedIds.length
      ? { puzzleId: { $nin: attemptedIds } }
      : {};

    let puzzles = await collection
      .aggregate([
        {
          $match: {
            rating: {
              $gte: rating,
              $lte: rating + RATING_BAND,
            },
            ...excludeMatch,
          },
        },
        { $sample: { size: count } },
      ])
      .toArray();

    // Widen the search if not enough puzzles exist
    if (puzzles.length < count) {
      puzzles = await collection
        .aggregate([
          {
            $match: {
              rating: {
                $gte: rating,
                $lte: rating + RATING_BAND * 2,
              },
              ...excludeMatch,
            },
          },
          { $sample: { size: count } },
        ])
        .toArray();
    }

    const result = await Promise.all(
      puzzles.map(async ({ _id, moves, ...rest }) => {
        const movesJson = JSON.stringify(moves);
        const puzzleId = rest.puzzleId as string;

        const encrypted = await encryptSolution(movesJson, puzzleId);
        const signature = await signSolution(puzzleId, playerPubkey);

        return {
          id: _id.toString(),
          ...rest,
          encryptedSolution: encrypted
            ? { iv: encrypted.iv, data: encrypted.data }
            : null,
          solutionKey: encrypted?.keyHex ?? null,
          solutionSignature: signature,
        };
      })
    );

    return NextResponse.json({ puzzles: result });
  } catch (error) {
    console.error(catchErr(error));

    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 }
    );
  }
}
