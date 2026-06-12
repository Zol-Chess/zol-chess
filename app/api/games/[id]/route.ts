import { NextResponse } from "next/server";
import { gameManager } from "@/app/lib/chess/game-manager";

type Params = { params: Promise<{ id: string }> };

// GET /api/games/:id  — fetch current game state
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const game = gameManager.get(id);
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}
