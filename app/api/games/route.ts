import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";
import { createGameState, validateDefenseRoster, validateGameRoster } from "@/lib/game-engine";
import { seasonPlayers } from "@/lib/player-directory";
import { toOpenGame, toPublicGame, type GameRecord } from "@/lib/game-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createGameSchema = z.object({
  roster: z.array(z.string().min(1).max(120)).length(5),
  defenseRoster: z.array(z.string().min(1).max(120)).length(5)
}).strict();
const maxRequestBytes = 10_000;
const gameColumns = "id, host_user_id, guest_user_id, status, home_roster, away_roster, state, created_at";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to play online." }, { status: 401 });

  try {
    const pool = getDbPool();
    const [openGamesResult, myGameResult] = await Promise.all([
      pool.query<GameRecord>(
        `SELECT ${gameColumns}
         FROM public.play_call_games
         WHERE status = 'waiting' AND host_user_id <> $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      ),
      pool.query<GameRecord>(
        `SELECT ${gameColumns}
         FROM public.play_call_games
         WHERE status IN ('waiting', 'active') AND (host_user_id = $1 OR guest_user_id = $1)
         ORDER BY updated_at DESC
         LIMIT 1`,
        [userId]
      )
    ]);

    const myGame = myGameResult.rows[0];
    return NextResponse.json({
      openGames: openGamesResult.rows.map(toOpenGame),
      myGame: myGame ? toPublicGame(myGame, userId) : null
    });
  } catch (error) {
    console.error("Unable to load online games.", error);
    return NextResponse.json({ error: "Online games are unavailable right now." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to create an online game." }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxRequestBytes) return NextResponse.json({ error: "Game request is too large." }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const parsed = createGameSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose valid five-player offense and defense lineups." }, { status: 400 });
  const rosterError = validateGameRoster(parsed.data.roster, seasonPlayers);
  if (rosterError) return NextResponse.json({ error: rosterError }, { status: 400 });
  const defenseError = validateDefenseRoster(parsed.data.defenseRoster, seasonPlayers, parsed.data.roster);
  if (defenseError) return NextResponse.json({ error: defenseError }, { status: 400 });

  try {
    const id = randomUUID();
    const state = createGameState(parsed.data.roster, [], parsed.data.defenseRoster, []);
    const result = await getDbPool().query<GameRecord>(
      `INSERT INTO public.play_call_games (id, host_user_id, status, home_roster, state)
       VALUES ($1, $2, 'waiting', $3::jsonb, $4::jsonb)
       RETURNING id, host_user_id, guest_user_id, status, home_roster, away_roster, state, created_at`,
      [id, userId, JSON.stringify(parsed.data.roster), JSON.stringify(state)]
    );
    return NextResponse.json({ game: toPublicGame(result.rows[0], userId) }, { status: 201 });
  } catch (error) {
    console.error("Unable to create an online game.", error);
    return NextResponse.json({ error: "Could not create an online game." }, { status: 500 });
  }
}
