import { NextRequest, NextResponse } from "next/server";

import { uploadToDB } from "@/script/puzzle-import";

// GET /api/puzzles?theme=mateInOne
// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const theme = searchParams.get("theme") ?? undefined;
//   const puzzle = getRandomPuzzle(theme);
//   // Never expose solution to client
//   const { solution: _, ...safe } = puzzle;
//   return NextResponse.json(safe);
// }

export async function POST(req: NextRequest) {
  try {
    await uploadToDB();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
