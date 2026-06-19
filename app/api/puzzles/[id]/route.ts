import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import { encryptSolution, signSolution } from "@/script/encrypt-solution";
import { catchErr } from "@/utils/error-handlers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const playerPubkey = new URL(req.url).searchParams.get("player") ?? "";

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
    console.error(catchErr(error));
    return NextResponse.json(
      { error: "Failed to fetch puzzle" },
      { status: 500 }
    );
  }
}
