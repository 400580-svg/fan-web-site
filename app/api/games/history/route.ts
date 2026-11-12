import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { toPublicGame, type GameRecord } from "@/lib/game-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to view online game history." }, { status: 401 });

  try {
    const result = await getDbPool().query<GameRecord>(
      `SELECT id, host_user_id, guest_user_id, status, home_roster, away_roster, state, created_at
       FROM public.play_call_games
       WHERE status = 'complete' AND (host_user_id = $1 OR guest_user_id = $1)
       ORDER BY updated_at DESC
       LIMIT 30`,
      [userId]
    );
    return NextResponse.json({ games: result.rows.map(row => toPublicGame(row, userId)) });
  } catch (error) {
    console.error("Unable to load completed online games.", error);
    return NextResponse.json({ error: "Game history is unavailable right now." }, { status: 500 });
  }
}
