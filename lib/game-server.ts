import { normalizeGameState, type GameSide, type GameState } from "@/lib/game-engine";

export type GameRecord = {
  id: string;
  host_user_id: string;
  guest_user_id: string | null;
  status: "waiting" | "active" | "complete" | "cancelled";
  home_roster: string[] | string;
  away_roster: string[] | string | null;
  state: GameState | string | null;
  created_at: Date | string;
};

export type PublicGame = {
  id: string;
  status: GameRecord["status"];
  homeRoster: string[];
  awayRoster: string[] | null;
  state: Omit<GameState, "pending"> | null;
  mySide: GameSide;
  myRole: "offense" | "defense" | null;
  myMoveSubmitted: boolean;
  opponentMoveSubmitted: boolean;
  createdAt: string;
};

export type OpenGame = {
  id: string;
  homeRoster: string[];
  createdAt: string;
};

function parseJson<T>(value: T | string | null): T | null {
  if (value === null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function asStringArray(value: string[] | string | null): string[] | null {
  const parsed = parseJson<string[]>(value);
  return Array.isArray(parsed) && parsed.every(item => typeof item === "string") ? parsed : null;
}

export function toPublicGame(row: GameRecord, userId: string): PublicGame {
  const mySide: GameSide = row.host_user_id === userId ? "home" : "away";
  const savedState = parseJson<GameState>(row.state);
  const internalState = savedState ? normalizeGameState(savedState) : null;
  let state: Omit<GameState, "pending"> | null = null;
  let myRole: PublicGame["myRole"] = null;
  let myMoveSubmitted = false;
  let opponentMoveSubmitted = false;

  if (internalState) {
    const { pending, ...publicState } = internalState;
    state = publicState;
    if (row.status === "active") {
      myRole = internalState.currentOffense === mySide ? "offense" : "defense";
      const otherRole = myRole === "offense" ? "defense" : "offense";
      myMoveSubmitted = Boolean(pending?.[myRole]);
      opponentMoveSubmitted = Boolean(pending?.[otherRole]);
    }
  }

  return {
    id: row.id,
    status: row.status,
    homeRoster: asStringArray(row.home_roster) || [],
    awayRoster: asStringArray(row.away_roster),
    state,
    mySide,
    myRole,
    myMoveSubmitted,
    opponentMoveSubmitted,
    createdAt: new Date(row.created_at).toISOString()
  };
}

export function toOpenGame(row: Pick<GameRecord, "id" | "home_roster" | "created_at">): OpenGame {
  return {
    id: row.id,
    homeRoster: asStringArray(row.home_roster) || [],
    createdAt: new Date(row.created_at).toISOString()
  };
}
