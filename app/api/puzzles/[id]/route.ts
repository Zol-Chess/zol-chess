import { NextResponse } from "next/server";

import { getPuzzle } from "@/lib/chess/puzzle-store";

type Params = { params: Promise<{ id: string }> };

// GET /api/puzzles/:id  — returns puzzle without solution
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const puzzle = getPuzzle(id);
  if (!puzzle)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { solution: _, ...safe } = puzzle;
  return NextResponse.json(safe);
}
