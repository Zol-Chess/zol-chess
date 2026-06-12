import { NextResponse } from "next/server";
import { gameManager } from "@/app/lib/chess/game-manager";

// GET /api/games?wallet=<address>  — list games for a wallet (TODO)
export async function GET() {
  return NextResponse.json({ games: [] });
}

// POST /api/games  — create a game directly (used for private matches)
// body: { whiteWallet, blackWallet, wagerLamports }
export async function POST(req: Request) {
  const { whiteWallet, blackWallet, wagerLamports = 0 } = await req.json();
  const game = gameManager.create(whiteWallet, blackWallet, wagerLamports);
  return NextResponse.json(game, { status: 201 });
}
