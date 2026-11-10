import { calculate2026SiteRatings } from "@/lib/player-ratings";
import type { PlayerProfile } from "@/lib/player-directory";

export const rosterSlots = ["QB", "RB", "WR", "WR", "TE"] as const;
export const drivesPerGame = 6;

export type GameSide = "home" | "away";
export type OffensiveCall = "run" | "quick_pass" | "deep_pass";
export type DefensiveCall = "stack_box" | "zone" | "blitz";
export type GameCall = OffensiveCall | DefensiveCall;

export type DriveSummary = {
  offense: GameSide;
  offenseCall: OffensiveCall;
  defenseCall: DefensiveCall;
  yards: number;
  points: 0 | 3 | 7;
  message: string;
};

export type GameState = {
  homeRoster: string[];
  awayRoster: string[];
  homeScore: number;
  awayScore: number;
  currentOffense: GameSide;
  drivesCompleted: number;
  pending: {
    offense: OffensiveCall | null;
    defense: DefensiveCall | null;
  };
  lastDrive: DriveSummary | null;
  history: DriveSummary[];
};

export function getRecommendedRoster(
  players: readonly PlayerProfile[],
  preferredIds: readonly string[] = [],
  excludedIds: readonly string[] = []
): string[] {
  const ratings = calculate2026SiteRatings(players);
  const available = players
    .filter(player => ratings[player.id] !== null && !excludedIds.includes(player.id))
    .sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0) || a.name.localeCompare(b.name));
  const used = new Set<string>();
  const roster: string[] = [];

  for (const position of rosterSlots) {
    const candidates = [
      ...preferredIds.map(id => available.find(player => player.id === id && player.position === position && !used.has(id))),
      ...available.filter(player => player.position === position && !used.has(player.id))
    ].filter((player): player is PlayerProfile => Boolean(player));
    const selected = candidates[0];
    if (!selected) return [];
    used.add(selected.id);
    roster.push(selected.id);
  }

  return roster;
}

export function validateGameRoster(rosterIds: unknown, players: readonly PlayerProfile[]): string | null {
  if (!Array.isArray(rosterIds) || rosterIds.length !== rosterSlots.length || rosterIds.some(id => typeof id !== "string")) {
    return "Choose a quarterback, running back, two receivers, and a tight end.";
  }
  const ids = rosterIds as string[];
  if (new Set(ids).size !== rosterSlots.length) return "Choose five different players.";

  const ratings = calculate2026SiteRatings(players);
  const selected = ids.map(id => players.find(player => player.id === id));
  if (selected.some(player => !player)) return "One or more selected players are not available.";
  if (selected.some(player => ratings[player!.id] === null)) return "Choose players with verified 2026 season stats.";

  const positions = selected.map(player => player!.position);
  const counts = new Map<string, number>();
  for (const position of positions) counts.set(position, (counts.get(position) || 0) + 1);
  for (const position of ["QB", "RB", "WR", "TE"]) {
    const needed = rosterSlots.filter(slot => slot === position).length;
    if ((counts.get(position) || 0) !== needed) {
      return "Your lineup needs 1 QB, 1 RB, 2 WRs, and 1 TE.";
    }
  }
  return null;
}

export function averageRosterRating(rosterIds: readonly string[], players: readonly PlayerProfile[]): number {
  const ratings = calculate2026SiteRatings(players);
  const values = rosterIds.map(id => ratings[id]).filter((rating): rating is 1 | 2 | 3 | 4 | 5 => rating !== null && rating !== undefined);
  return values.length ? values.reduce((total, rating) => total + rating, 0) / values.length : 0;
}

export function createGameState(homeRoster: readonly string[], awayRoster: readonly string[]): GameState {
  return {
    homeRoster: [...homeRoster],
    awayRoster: [...awayRoster],
    homeScore: 0,
    awayScore: 0,
    currentOffense: "home",
    drivesCompleted: 0,
    pending: { offense: null, defense: null },
    lastDrive: null,
    history: []
  };
}

export function counterDefense(offenseCall: OffensiveCall): DefensiveCall {
  if (offenseCall === "run") return "stack_box";
  if (offenseCall === "quick_pass") return "blitz";
  return "zone";
}

export function counterOffense(defenseCall: DefensiveCall): OffensiveCall {
  if (defenseCall === "stack_box") return "deep_pass";
  if (defenseCall === "blitz") return "quick_pass";
  return "run";
}

export function resolveDrive(
  state: GameState,
  players: readonly PlayerProfile[],
  offenseCall: OffensiveCall,
  defenseCall: DefensiveCall,
  roll = Math.random()
): GameState {
  const offense = state.currentOffense;
  const offenseRoster = offense === "home" ? state.homeRoster : state.awayRoster;
  const defenseRoster = offense === "home" ? state.awayRoster : state.homeRoster;
  const offenseRating = averageRosterRating(offenseRoster, players);
  const defenseRating = averageRosterRating(defenseRoster, players);
  const matchupAdvantage: Record<OffensiveCall, Record<DefensiveCall, number>> = {
    run: { stack_box: -5, zone: 2, blitz: 1 },
    quick_pass: { stack_box: 1, zone: 3, blitz: -4 },
    deep_pass: { stack_box: 1, zone: -4, blitz: 3 }
  };
  const variance = Math.round((Math.max(0, Math.min(1, roll)) * 14) - 7);
  const yards = Math.max(-5, Math.min(36, Math.round(8 + (offenseRating - defenseRating) * 2 + matchupAdvantage[offenseCall][defenseCall] + variance)));
  const points: 0 | 3 | 7 = yards >= 24 ? 7 : yards >= 11 ? 3 : 0;
  const message = points === 7
    ? "Touchdown — the offense breaks through."
    : points === 3
      ? "Field goal — the drive reaches scoring range."
      : yards <= 0
        ? "Turnover — the defense wins the matchup."
        : "Punt — the defense forces a stop.";
  const summary: DriveSummary = { offense, offenseCall, defenseCall, yards, points, message };
  const completed = state.drivesCompleted + 1;
  const nextOffense: GameSide = offense === "home" ? "away" : "home";

  return {
    ...state,
    homeScore: state.homeScore + (offense === "home" ? points : 0),
    awayScore: state.awayScore + (offense === "away" ? points : 0),
    currentOffense: nextOffense,
    drivesCompleted: completed,
    pending: { offense: null, defense: null },
    lastDrive: summary,
    history: [...state.history, summary].slice(-drivesPerGame)
  };
}
