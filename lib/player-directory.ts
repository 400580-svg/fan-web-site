import { leaderboardConfig, topTenPlayers2026 } from "@/lib/top-ten-2026";

export type PlayerProfile = {
  id: string;
  name: string;
  team: string;
  position: string;
  number: string;
  games: number;
  passingYards: number | null;
  passingTouchdowns: number | null;
  interceptions: number | null;
  passerRating: number | null;
  rushingYards: number | null;
  rushingTouchdowns: number | null;
  receptions: number | null;
  receivingYards: number | null;
  receivingTouchdowns: number | null;
  statsUrl: string;
  initials: string;
  note: string;
  positionRank?: number;
};

const originalPlayers: PlayerProfile[] = [
  { id: "p1", name: "Justin Herbert", team: "Los Angeles Chargers", position: "QB", number: "10", games: 8, passingYards: 1591, passingTouchdowns: 6, interceptions: 11, passerRating: 70.4, rushingYards: 190, rushingTouchdowns: 0, receptions: null, receivingYards: null, receivingTouchdowns: null, statsUrl: "https://www.nfl.com/players/justin-herbert/stats/career", initials: "JH", note: "Quick-game accuracy and layered throws" },
  { id: "p2", name: "Patrick Mahomes", team: "Kansas City Chiefs", position: "QB", number: "15", games: 7, passingYards: 1795, passingTouchdowns: 12, interceptions: 4, passerRating: 99.7, rushingYards: 77, rushingTouchdowns: 1, receptions: null, receivingYards: null, receivingTouchdowns: null, statsUrl: "https://www.nfl.com/players/patrick-mahomes/stats/career", initials: "PM", note: "Off-platform creation and red-zone reads" },
  { id: "p3", name: "Lamar Jackson", team: "Baltimore Ravens", position: "QB", number: "8", games: 5, passingYards: 967, passingTouchdowns: 6, interceptions: 1, passerRating: 118.4, rushingYards: 144, rushingTouchdowns: 1, receptions: null, receivingYards: null, receivingTouchdowns: null, statsUrl: "https://www.nfl.com/players/lamar-jackson/stats/career", initials: "LJ", note: "Designed run threat reshapes the box" },
  { id: "p4", name: "CeeDee Lamb", team: "Dallas Cowboys", position: "WR", number: "88", games: 9, passingYards: null, passingTouchdowns: null, interceptions: null, passerRating: null, rushingYards: -6, rushingTouchdowns: 0, receptions: 70, receivingYards: 904, receivingTouchdowns: 7, statsUrl: "https://www.nfl.com/players/ceedee-lamb/stats/career", initials: "CL", note: "Elite separation from the slot" },
  { id: "p5", name: "Christian McCaffrey", team: "San Francisco 49ers", position: "RB", number: "23", games: 8, passingYards: null, passingTouchdowns: null, interceptions: null, passerRating: null, rushingYards: 457, rushingTouchdowns: 9, receptions: 36, receivingYards: 270, receivingTouchdowns: 1, statsUrl: "https://www.nfl.com/players/christian-mccaffrey/stats/career", initials: "CM", note: "Three-down mismatch creator" },
  { id: "p6", name: "A.J. Brown", team: "New England Patriots", position: "WR", number: "1", games: 3, passingYards: null, passingTouchdowns: null, interceptions: null, passerRating: null, rushingYards: null, rushingTouchdowns: null, receptions: 9, receivingYards: 101, receivingTouchdowns: 0, statsUrl: "https://www.nfl.com/players/a-j-brown/stats/career", initials: "AB", note: "Power release wins outside leverage" },
  { id: "p7", name: "Travis Kelce", team: "Kansas City Chiefs", position: "TE", number: "87", games: 7, passingYards: null, passingTouchdowns: null, interceptions: null, passerRating: null, rushingYards: null, rushingTouchdowns: null, receptions: 29, receivingYards: 410, receivingTouchdowns: 2, statsUrl: "https://www.nfl.com/players/travis-kelce/stats/career", initials: "TK", note: "Finds soft spots against zone" },
  { id: "p8", name: "Josh Allen", team: "Buffalo Bills", position: "QB", number: "17", games: 7, passingYards: 1793, passingTouchdowns: 11, interceptions: 5, passerRating: 101.1, rushingYards: 270, rushingTouchdowns: 9, receptions: null, receivingYards: null, receivingTouchdowns: null, statsUrl: "https://www.nfl.com/players/josh-allen/stats/career", initials: "JA", note: "Arm talent stretches every coverage" },
  { id: "p9", name: "Tyreek Hill", team: "Free agent", position: "WR", number: "—", games: 0, passingYards: null, passingTouchdowns: null, interceptions: null, passerRating: null, rushingYards: null, rushingTouchdowns: null, receptions: null, receivingYards: null, receivingTouchdowns: null, statsUrl: "https://www.nfl.com/players/tyreek-hill/stats/career", initials: "TH", note: "NFL.com listed no 2026 regular-season line as of Nov. 9." }
];

const topTenNames = new Set(topTenPlayers2026.map(player => player.name));
const rankedPlayerProfiles: PlayerProfile[] = topTenPlayers2026.map(ranked => {
  const existing = originalPlayers.find(player => player.name === ranked.name);
  const initials = ranked.name.split(/\s+/).slice(0, 2).map(part => part.replace(/[^a-z]/gi, "")[0] || "").join("").toUpperCase();
  return {
    id: existing?.id || ranked.id,
    name: ranked.name,
    team: ranked.team,
    position: ranked.position,
    number: existing?.number || "—",
    games: ranked.games,
    passingYards: ranked.passingYards ?? null,
    passingTouchdowns: ranked.passingTouchdowns ?? null,
    interceptions: ranked.interceptions ?? null,
    passerRating: ranked.passerRating ?? null,
    rushingYards: ranked.rushingYards ?? null,
    rushingTouchdowns: ranked.rushingTouchdowns ?? null,
    receptions: ranked.receptions ?? null,
    receivingYards: ranked.receivingYards ?? null,
    receivingTouchdowns: ranked.receivingTouchdowns ?? null,
    statsUrl: leaderboardConfig[ranked.position].sourceUrl,
    initials: existing?.initials || initials,
    note: existing?.note || "",
    positionRank: ranked.rank
  };
});

export const seasonPlayers: PlayerProfile[] = [
  ...rankedPlayerProfiles,
  ...originalPlayers.filter(player => !topTenNames.has(player.name))
];
