import { NextResponse } from "next/server";
import { gameManager } from "@/app/lib/chess/game-manager";

type Params = { params: Promise<{ id: string }> };

// POST /api/games/:id/resign  — body: { walletAddress }
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { walletAddress } = await req.json();
  const game = gameManager.resign(id, walletAddress);
  return NextResponse.json(game);
}
