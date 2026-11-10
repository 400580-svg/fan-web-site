import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";
import {
  createGameState,
  drivesPerGame,
  normalizeGameState,
  playsPerDrive,
  resolvePlay,
  validateGameRoster,
  type DefensiveCall,
  type GameCall,
  type GameState,
  type OffensiveCall
} from "@/lib/game-engine";
import { seasonPlayers } from "@/lib/player-directory";
import { toPublicGame, type GameRecord } from "@/lib/game-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const callSchema = z.enum(["run", "quick_pass", "deep_pass", "stack_box", "zone", "blitz"]);
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("join"), roster: z.array(z.string().min(1).max(120)).length(5) }).strict(),
  z.object({ action: z.literal("call"), call: callSchema, play: z.number().int().min(0).max(drivesPerGame * playsPerDrive - 1) }).strict(),
  z.object({ action: z.literal("cancel") }).strict(),
  z.object({ action: z.literal("leave") }).strict()
]);
const maxRequestBytes = 10_000;
const gameColumns = "id, host_user_id, guest_user_id, status, home_roster, away_roster, state, created_at";

function readRoster(value: GameRecord["home_roster"]): string[] {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (!Array.isArray(parsed) || !parsed.every(id => typeof id === "string")) {
    throw new Error("Stored game roster is invalid.");
  }
  return parsed;
}

function readGameState(value: GameRecord["state"]): GameState {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (!parsed || typeof parsed !== "object" || !("pending" in parsed)) {
    throw new Error("Stored game state is invalid.");
  }
  return normalizeGameState(parsed as GameState);
}

function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to access online games." }, { status: 401 });
  const { gameId } = await context.params;
  if (!z.string().uuid().safeParse(gameId).success) return NextResponse.json({ error: "Game not found." }, { status: 404 });

  try {
    const result = await getDbPool().query<GameRecord>(
      `SELECT ${gameColumns}
       FROM public.play_call_games
       WHERE id = $1 AND (host_user_id = $2 OR guest_user_id = $2)`,
      [gameId, userId]
    );
    const row = result.rows[0];
    if (!row) return NextResponse.json({ error: "Game not found." }, { status: 404 });
    return NextResponse.json({ game: toPublicGame(row, userId) });
  } catch (error) {
    console.error("Unable to load an online game.", error);
    return NextResponse.json({ error: "Game could not be loaded." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to play online." }, { status: 401 });
  const { gameId } = await context.params;
  if (!z.string().uuid().safeParse(gameId).success) return NextResponse.json({ error: "Game not found." }, { status: 404 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxRequestBytes) return NextResponse.json({ error: "Game request is too large." }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid game action." }, { status: 400 });

  const client = await getDbPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<GameRecord>(
      `SELECT ${gameColumns}
       FROM public.play_call_games
       WHERE id = $1
       FOR UPDATE`,
      [gameId]
    );
    const row = result.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    if (parsed.data.action === "join") {
      if (row.status !== "waiting") {
        await client.query("ROLLBACK");
        return conflict("This game is no longer open.");
      }
      if (row.host_user_id === userId) {
        await client.query("ROLLBACK");
        return conflict("You cannot join your own game.");
      }
      const rosterError = validateGameRoster(parsed.data.roster, seasonPlayers);
      if (rosterError) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: rosterError }, { status: 400 });
      }
      const homeRoster = readRoster(row.home_roster);
      const awayRoster = parsed.data.roster;
      const state = createGameState(homeRoster, awayRoster);
      await client.query(
        `UPDATE public.play_call_games
         SET guest_user_id = $1, status = 'active', away_roster = $2::jsonb, state = $3::jsonb, updated_at = now()
         WHERE id = $4`,
        [userId, JSON.stringify(awayRoster), JSON.stringify(state), gameId]
      );
      await client.query("COMMIT");
      return NextResponse.json({
        game: toPublicGame({ ...row, guest_user_id: userId, status: "active", away_roster: awayRoster, state }, userId)
      });
    }

    if (row.host_user_id !== userId && row.guest_user_id !== userId) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    if (parsed.data.action === "cancel") {
      if (row.status !== "waiting" || row.host_user_id !== userId) {
        await client.query("ROLLBACK");
        return conflict("Only the host can cancel an open game.");
      }
      await client.query(
        "UPDATE public.play_call_games SET status = 'cancelled', updated_at = now() WHERE id = $1",
        [gameId]
      );
      await client.query("COMMIT");
      return NextResponse.json({ game: toPublicGame({ ...row, status: "cancelled" }, userId) });
    }

    if (parsed.data.action === "leave") {
      if (row.status !== "active") {
        await client.query("ROLLBACK");
        return conflict("This match is no longer active.");
      }
      await client.query(
        "UPDATE public.play_call_games SET status = 'cancelled', updated_at = now() WHERE id = $1",
        [gameId]
      );
      await client.query("COMMIT");
      return NextResponse.json({ game: toPublicGame({ ...row, status: "cancelled" }, userId) });
    }

    if (row.status !== "active") {
      await client.query("ROLLBACK");
      return conflict("This game is not accepting plays.");
    }

    const state = readGameState(row.state);
    if (parsed.data.play !== state.history.length) {
      await client.query("ROLLBACK");
      return conflict("That play has already advanced. Refresh the match before calling another play.");
    }
    const mySide = row.host_user_id === userId ? "home" : "away";
    const role = state.currentOffense === mySide ? "offense" : "defense";
    const call = parsed.data.call as GameCall;
    const offenseCalls: OffensiveCall[] = ["run", "quick_pass", "deep_pass"];
    const defenseCalls: DefensiveCall[] = ["stack_box", "zone", "blitz"];
    if (role === "offense" && !offenseCalls.includes(call as OffensiveCall)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Choose an offensive play." }, { status: 400 });
    }
    if (role === "defense" && !defenseCalls.includes(call as DefensiveCall)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Choose a defensive call." }, { status: 400 });
    }

    const existing = state.pending[role];
    if (existing) {
      await client.query("ROLLBACK");
      if (existing === call) {
        const latest = await getDbPool().query<GameRecord>(`SELECT ${gameColumns} FROM public.play_call_games WHERE id = $1`, [gameId]);
        return NextResponse.json({ game: toPublicGame(latest.rows[0], userId) });
      }
      return conflict("Your call is already locked in. Wait for the other player.");
    }

    if (role === "offense") state.pending.offense = call as OffensiveCall;
    else state.pending.defense = call as DefensiveCall;
    let status: GameRecord["status"] = "active";
    if (state.pending.offense && state.pending.defense) {
      const nextState = resolvePlay(
        state,
        seasonPlayers,
        state.pending.offense,
        state.pending.defense
      );
      Object.assign(state, nextState);
      if (state.drivesCompleted >= drivesPerGame) status = "complete";
    }

    await client.query(
      "UPDATE public.play_call_games SET state = $1::jsonb, status = $2, updated_at = now() WHERE id = $3",
      [JSON.stringify(state), status, gameId]
    );
    await client.query("COMMIT");
    return NextResponse.json({ game: toPublicGame({ ...row, state, status }, userId) });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Unable to update an online game.", error);
    return NextResponse.json({ error: "Game action could not be saved." }, { status: 500 });
  } finally {
    client.release();
  }
}
