import { NextResponse } from "next/server";

import { clientPromise } from "@/lib/mongodb";

type Params = { params: Promise<{ level: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { level } = await params;
    const client = await clientPromise;

    const puzzle = await client
      .db("chess")
      .collection("puzzles")
      .aggregate([
        { $match: { ratingLevel: Number(level) } },
        { $sample: { size: 1 } },
      ])
      .toArray();

    return Response.json(puzzle[0] ?? null);
  } catch (error) {
    return NextResponse.json(null);
  }
}
