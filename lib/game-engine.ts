import { calculate2026SiteRatings } from "@/lib/player-ratings";
import type { PlayerProfile } from "@/lib/player-directory";

export const rosterSlots = ["QB", "RB", "WR", "WR", "TE"] as const;
export const drivesPerGame = 6;
export const playsPerDrive = 8;

export type GameSide = "home" | "away";
export type OffensiveCall = "run" | "power_run" | "outside_run" | "quick_pass" | "screen_pass" | "deep_pass";
export type DefensiveCall = "stack_box" | "zone" | "blitz" | "man" | "prevent" | "qb_spy" | "contain";
export type GameCall = OffensiveCall | DefensiveCall;

export type PlaySummary = {
  driveNumber: number;
  playNumber: number;
  offense: GameSide;
  offenseCall: OffensiveCall;
  defenseCall: DefensiveCall;
  yards: number;
  driveYards: number;
  points: 0 | 3 | 7;
  possessionEnded: boolean;
  turnoverOnDowns: boolean;
  message: string;
};

export type GameState = {
  homeRoster: string[];
  awayRoster: string[];
  homeScore: number;
  awayScore: number;
  currentOffense: GameSide;
  drivesCompleted: number;
  playsInDrive: number;
  yardsOnDrive: number;
  pending: {
    offense: OffensiveCall | null;
    defense: DefensiveCall | null;
  };
  lastDrive: PlaySummary | null;
  history: PlaySummary[];
};

export function normalizeGameState(state: GameState): GameState {
  const normalizeSummary = (summary: PlaySummary, index: number): PlaySummary => ({
    ...summary,
    driveNumber: Number.isInteger(summary.driveNumber) ? summary.driveNumber : index + 1,
    playNumber: Number.isInteger(summary.playNumber) ? summary.playNumber : 1,
    driveYards: Number.isFinite(summary.driveYards) ? summary.driveYards : summary.yards,
    possessionEnded: typeof summary.possessionEnded === "boolean" ? summary.possessionEnded : true,
    turnoverOnDowns: typeof summary.turnoverOnDowns === "boolean" ? summary.turnoverOnDowns : false
  });
  const history = Array.isArray(state.history) ? state.history.map(normalizeSummary) : [];
  return {
    ...state,
    playsInDrive: Number.isInteger(state.playsInDrive) ? state.playsInDrive : 0,
    yardsOnDrive: Number.isFinite(state.yardsOnDrive) ? state.yardsOnDrive : 0,
    pending: state.pending || { offense: null, defense: null },
    lastDrive: state.lastDrive
      ? normalizeSummary(state.lastDrive, Math.max(0, state.drivesCompleted - 1))
      : null,
    history
  };
}

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
    playsInDrive: 0,
    yardsOnDrive: 0,
    pending: { offense: null, defense: null },
    lastDrive: null,
    history: []
  };
}

export function counterDefense(offenseCall: OffensiveCall): DefensiveCall {
  if (offenseCall === "run" || offenseCall === "power_run") return "stack_box";
  if (offenseCall === "outside_run") return "qb_spy";
  if (offenseCall === "quick_pass") return "blitz";
  if (offenseCall === "screen_pass") return "zone";
  return "prevent";
}

export function counterOffense(defenseCall: DefensiveCall): OffensiveCall {
  if (defenseCall === "stack_box") return "deep_pass";
  if (defenseCall === "blitz") return "screen_pass";
  if (defenseCall === "prevent") return "run";
  if (defenseCall === "qb_spy") return "outside_run";
  if (defenseCall === "contain") return "power_run";
  if (defenseCall === "man") return "quick_pass";
  return "outside_run";
}

export function resolvePlay(
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
    run: { stack_box: -5, zone: 2, blitz: 1, man: 2, prevent: 3, qb_spy: 2, contain: -2 },
    power_run: { stack_box: -4, zone: 1, blitz: 0, man: 1, prevent: 3, qb_spy: 1, contain: 3 },
    outside_run: { stack_box: 1, zone: 2, blitz: -2, man: 2, prevent: 2, qb_spy: -3, contain: -4 },
    quick_pass: { stack_box: 1, zone: 3, blitz: -4, man: -2, prevent: -2, qb_spy: 1, contain: 2 },
    screen_pass: { stack_box: 2, zone: 0, blitz: 4, man: 1, prevent: -1, qb_spy: -1, contain: 0 },
    deep_pass: { stack_box: 1, zone: -4, blitz: 3, man: -2, prevent: -5, qb_spy: 1, contain: 2 }
  };
  const variance = Math.round((Math.max(0, Math.min(1, roll)) * 14) - 7);
  const yards = Math.max(-4, Math.min(18, Math.round(4 + (offenseRating - defenseRating) * 1.2 + matchupAdvantage[offenseCall][defenseCall] + variance)));
  const playNumber = state.playsInDrive + 1;
  const driveYards = state.yardsOnDrive + yards;
  let points: 0 | 3 | 7 = 0;
  let possessionEnded = false;
  let turnoverOnDowns = false;
  let message: string;

  if (driveYards >= 32) {
    points = 7;
    possessionEnded = true;
    message = "Touchdown — the offense reaches the end zone.";
  } else if (playNumber === playsPerDrive) {
    possessionEnded = true;
    if (driveYards >= 20) {
      points = 3;
      message = "Field goal — the offense scores on the final play.";
    } else {
      turnoverOnDowns = true;
      message = `No score after ${playsPerDrive} plays — turnover on downs.`;
    }
  } else {
    const remaining = playsPerDrive - playNumber;
    message = `${yards < 0 ? `${Math.abs(yards)}-yard loss` : `${yards} yards`} — ${remaining} ${remaining === 1 ? "play" : "plays"} left to score.`;
  }

  const summary: PlaySummary = {
    driveNumber: state.drivesCompleted + 1,
    playNumber,
    offense,
    offenseCall,
    defenseCall,
    yards,
    driveYards,
    points,
    possessionEnded,
    turnoverOnDowns,
    message
  };
  const completed = state.drivesCompleted + (possessionEnded ? 1 : 0);
  const nextOffense: GameSide = possessionEnded
    ? offense === "home" ? "away" : "home"
    : offense;

  return {
    ...state,
    homeScore: state.homeScore + (offense === "home" ? points : 0),
    awayScore: state.awayScore + (offense === "away" ? points : 0),
    currentOffense: nextOffense,
    drivesCompleted: completed,
    playsInDrive: possessionEnded ? 0 : playNumber,
    yardsOnDrive: possessionEnded ? 0 : driveYards,
    pending: { offense: null, defense: null },
    lastDrive: summary,
    history: [...state.history, summary].slice(-(drivesPerGame * playsPerDrive))
  };
}
