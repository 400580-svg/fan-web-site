export type DefensivePosition = "DE" | "DT" | "LB" | "CB" | "S";

export type DefensivePlayerData = {
  id: string;
  name: string;
  team: string;
  position: DefensivePosition;
  games: number;
  tackles: number;
  sacks: number;
  tacklesForLoss: number;
  passesDefended: number;
  interceptions: number;
};

export const defenseStatsUrl = "https://www.espn.com/nfl/stats/player/_/view/defense/table/defensive/sort/totalTackles/dir/desc";

export const defensivePlayers2026: DefensivePlayerData[] = [
  { id: "def-2026-will-anderson", name: "Will Anderson Jr.", team: "Houston Texans", position: "DE", games: 8, tackles: 35, sacks: 9.5, tacklesForLoss: 14, passesDefended: 1, interceptions: 0 },
  { id: "def-2026-chase-young", name: "Chase Young", team: "New Orleans Saints", position: "DE", games: 8, tackles: 18, sacks: 8, tacklesForLoss: 8, passesDefended: 4, interceptions: 0 },
  { id: "def-2026-carl-granderson", name: "Carl Granderson", team: "New Orleans Saints", position: "DE", games: 7, tackles: 32, sacks: 7.5, tacklesForLoss: 10, passesDefended: 1, interceptions: 0 },
  { id: "def-2026-jacob-martin", name: "Jacob Martin", team: "Tennessee Titans", position: "DE", games: 8, tackles: 11, sacks: 6.5, tacklesForLoss: 8, passesDefended: 2, interceptions: 0 },
  { id: "def-2026-alim-mcneill", name: "Alim McNeill", team: "Detroit Lions", position: "DE", games: 8, tackles: 22, sacks: 5.5, tacklesForLoss: 8, passesDefended: 1, interceptions: 0 },

  { id: "def-2026-boye-mafe", name: "Boye Mafe", team: "Cincinnati Bengals", position: "DT", games: 9, tackles: 48, sacks: 6, tacklesForLoss: 9, passesDefended: 6, interceptions: 0 },
  { id: "def-2026-dexter-lawrence", name: "Dexter Lawrence II", team: "Cincinnati Bengals", position: "DT", games: 8, tackles: 17, sacks: 5.5, tacklesForLoss: 7, passesDefended: 1, interceptions: 0 },
  { id: "def-2026-dj-wonnum", name: "DJ Wonnum", team: "Detroit Lions", position: "DT", games: 8, tackles: 27, sacks: 5, tacklesForLoss: 9, passesDefended: 1, interceptions: 0 },
  { id: "def-2026-aidan-hutchinson", name: "Aidan Hutchinson", team: "Detroit Lions", position: "DT", games: 9, tackles: 36, sacks: 5, tacklesForLoss: 14, passesDefended: 1, interceptions: 0 },
  { id: "def-2026-zadarius-smith", name: "Za'Darius Smith", team: "Atlanta Falcons", position: "DT", games: 9, tackles: 25, sacks: 5, tacklesForLoss: 7, passesDefended: 3, interceptions: 0 },

  { id: "def-2026-alex-singleton", name: "Alex Singleton", team: "Denver Broncos", position: "LB", games: 9, tackles: 107, sacks: 2, tacklesForLoss: 5, passesDefended: 2, interceptions: 0 },
  { id: "def-2026-nakobe-dean", name: "Nakobe Dean", team: "Las Vegas Raiders", position: "LB", games: 9, tackles: 99, sacks: 1.5, tacklesForLoss: 7, passesDefended: 2, interceptions: 1 },
  { id: "def-2026-carson-schwesinger", name: "Carson Schwesinger", team: "Cleveland Browns", position: "LB", games: 9, tackles: 89, sacks: 3, tacklesForLoss: 5, passesDefended: 1, interceptions: 0 },
  { id: "def-2026-ernest-jones", name: "Ernest Jones IV", team: "Seattle Seahawks", position: "LB", games: 9, tackles: 88, sacks: 3, tacklesForLoss: 3, passesDefended: 5, interceptions: 1 },
  { id: "def-2026-anthony-hill", name: "Anthony Hill Jr.", team: "Tennessee Titans", position: "LB", games: 8, tackles: 82, sacks: 0, tacklesForLoss: 1, passesDefended: 3, interceptions: 0 },
  { id: "def-2026-nick-bolton", name: "Nick Bolton", team: "Kansas City Chiefs", position: "LB", games: 8, tackles: 80, sacks: 0, tacklesForLoss: 4, passesDefended: 2, interceptions: 0 },
  { id: "def-2026-jacob-rodriguez", name: "Jacob Rodriguez", team: "Miami Dolphins", position: "LB", games: 8, tackles: 79, sacks: 1, tacklesForLoss: 5, passesDefended: 1, interceptions: 1 },
  { id: "def-2026-fred-warner", name: "Fred Warner", team: "San Francisco 49ers", position: "LB", games: 8, tackles: 77, sacks: 0.5, tacklesForLoss: 5, passesDefended: 3, interceptions: 0 },

  { id: "def-2026-byron-murphy", name: "Byron Murphy Jr.", team: "Minnesota Vikings", position: "CB", games: 8, tackles: 38, sacks: 0, tacklesForLoss: 1, passesDefended: 7, interceptions: 4 },
  { id: "def-2026-zyon-mccollum", name: "Zyon McCollum", team: "Tampa Bay Buccaneers", position: "CB", games: 9, tackles: 35, sacks: 0, tacklesForLoss: 2, passesDefended: 11, interceptions: 4 },
  { id: "def-2026-renardo-green", name: "Renardo Green", team: "San Francisco 49ers", position: "CB", games: 8, tackles: 30, sacks: 0, tacklesForLoss: 0, passesDefended: 6, interceptions: 4 },
  { id: "def-2026-jourdan-lewis", name: "Jourdan Lewis", team: "Jacksonville Jaguars", position: "CB", games: 8, tackles: 22, sacks: 0, tacklesForLoss: 0, passesDefended: 3, interceptions: 3 },
  { id: "def-2026-denzel-ward", name: "Denzel Ward", team: "Cleveland Browns", position: "CB", games: 9, tackles: 34, sacks: 0, tacklesForLoss: 0, passesDefended: 9, interceptions: 3 },

  { id: "def-2026-amani-hooker", name: "Amani Hooker", team: "Tennessee Titans", position: "S", games: 7, tackles: 52, sacks: 0, tacklesForLoss: 1, passesDefended: 6, interceptions: 5 },
  { id: "def-2026-xavier-mckinney", name: "Xavier McKinney", team: "Green Bay Packers", position: "S", games: 9, tackles: 38, sacks: 1, tacklesForLoss: 1, passesDefended: 6, interceptions: 5 },
  { id: "def-2026-quentin-lake", name: "Quentin Lake", team: "Los Angeles Rams", position: "S", games: 9, tackles: 63, sacks: 0, tacklesForLoss: 0, passesDefended: 11, interceptions: 3 },
  { id: "def-2026-jevon-holland", name: "Jevon Holland", team: "New York Giants", position: "S", games: 7, tackles: 34, sacks: 0, tacklesForLoss: 3, passesDefended: 5, interceptions: 3 },
  { id: "def-2026-evan-williams", name: "Evan Williams", team: "Green Bay Packers", position: "S", games: 9, tackles: 76, sacks: 1, tacklesForLoss: 2, passesDefended: 7, interceptions: 3 }
];
