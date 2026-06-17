import { NextRequest, NextResponse } from "next/server";

import { clientPromise } from "@/lib/mongodb";
import { encryptSolution, signSolution } from "@/script/encrypt-solution";
import { catchErr } from "@/utils/error-handlers";

// Prevent Next.js from caching this route so $sample returns different puzzles each time
export const dynamic = "force-dynamic";

const RATING_BAND = 100;

// GET /api/puzzles?rating=1200&count=10
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rating = Number(searchParams.get("rating") ?? 800);
  const count = Math.min(Number(searchParams.get("count") ?? 10), 50);

  try {
    const client = await clientPromise;
    const collection = client.db("chess").collection("puzzles");

    let puzzles = await collection
      .aggregate([
        {
          $match: {
            rating: {
              $gte: Math.max(0, rating - RATING_BAND),
              $lte: rating,
            },
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
                $gte: Math.max(0, rating - RATING_BAND * 2),
                $lte: rating,
              },
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
        const signature = await signSolution(movesJson, puzzleId);

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
