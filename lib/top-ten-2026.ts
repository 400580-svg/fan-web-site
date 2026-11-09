export type LeaderboardPosition = "QB" | "RB" | "WR" | "TE";

export type RankedPlayerData = {
  id: string;
  name: string;
  team: string;
  position: LeaderboardPosition;
  rank: number;
  games: number;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  passerRating?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
};

export const leaderboardConfig: Record<LeaderboardPosition, {
  label: string;
  metric: string;
  sourceUrl: string;
}> = {
  QB: {
    label: "Quarterbacks",
    metric: "Passing yards",
    sourceUrl: "https://www.statmuse.com/nfl/ask/pass-yards-leaders-2026"
  },
  RB: {
    label: "Running backs",
    metric: "Rushing yards",
    sourceUrl: "https://www.statmuse.com/nfl/ask/nfl-2026-rushing-yard-leaders-players"
  },
  WR: {
    label: "Wide receivers",
    metric: "Receiving yards",
    sourceUrl: "https://www.statmuse.com/nfl/ask/nfl-receiving-leaders-2026"
  },
  TE: {
    label: "Tight ends",
    metric: "Receiving yards",
    sourceUrl: "https://www.statmuse.com/nfl/ask/nfl-te-receiving-yard-leaders-2026"
  }
};

export const topTenPlayers2026: RankedPlayerData[] = [
  { id: "rank-qb-jordan-love", name: "Jordan Love", team: "Green Bay Packers", position: "QB", rank: 1, games: 9, passingYards: 2618, passingTouchdowns: 19, interceptions: 6, passerRating: 97.9 },
  { id: "rank-qb-joe-burrow", name: "Joe Burrow", team: "Cincinnati Bengals", position: "QB", rank: 2, games: 8, passingYards: 2386, passingTouchdowns: 23, interceptions: 6, passerRating: 114.8 },
  { id: "rank-qb-dak-prescott", name: "Dak Prescott", team: "Dallas Cowboys", position: "QB", rank: 3, games: 9, passingYards: 2381, passingTouchdowns: 16, interceptions: 5, passerRating: 95.3 },
  { id: "rank-qb-matthew-stafford", name: "Matthew Stafford", team: "Los Angeles Rams", position: "QB", rank: 4, games: 9, passingYards: 2374, passingTouchdowns: 16, interceptions: 9, passerRating: 90.6 },
  { id: "rank-qb-kirk-cousins", name: "Kirk Cousins", team: "Las Vegas Raiders", position: "QB", rank: 5, games: 9, passingYards: 2340, passingTouchdowns: 20, interceptions: 8, passerRating: 97.1 },
  { id: "rank-qb-drake-maye", name: "Drake Maye", team: "New England Patriots", position: "QB", rank: 6, games: 9, passingYards: 2282, passingTouchdowns: 18, interceptions: 11, passerRating: 96.8 },
  { id: "rank-qb-cj-stroud", name: "C.J. Stroud", team: "Houston Texans", position: "QB", rank: 7, games: 8, passingYards: 2251, passingTouchdowns: 16, interceptions: 2, passerRating: 104.8 },
  { id: "rank-qb-bryce-young", name: "Bryce Young", team: "Carolina Panthers", position: "QB", rank: 8, games: 8, passingYards: 2197, passingTouchdowns: 16, interceptions: 6, passerRating: 91.3 },
  { id: "rank-qb-jared-goff", name: "Jared Goff", team: "Detroit Lions", position: "QB", rank: 9, games: 8, passingYards: 2134, passingTouchdowns: 15, interceptions: 2, passerRating: 106.4 },
  { id: "rank-qb-geno-smith", name: "Geno Smith", team: "New York Jets", position: "QB", rank: 10, games: 9, passingYards: 2078, passingTouchdowns: 12, interceptions: 3, passerRating: 100.5 },

  { id: "rank-rb-bijan-robinson", name: "Bijan Robinson", team: "Atlanta Falcons", position: "RB", rank: 1, games: 9, rushingYards: 880, rushingTouchdowns: 5, receptions: 31, receivingYards: 250, receivingTouchdowns: 1 },
  { id: "rank-rb-kenneth-walker", name: "Kenneth Walker III", team: "Kansas City Chiefs", position: "RB", rank: 2, games: 8, rushingYards: 872, rushingTouchdowns: 7, receptions: 26, receivingYards: 172, receivingTouchdowns: 4 },
  { id: "rank-rb-jahmyr-gibbs", name: "Jahmyr Gibbs", team: "Detroit Lions", position: "RB", rank: 3, games: 8, rushingYards: 847, rushingTouchdowns: 9, receptions: 34, receivingYards: 285, receivingTouchdowns: 2 },
  { id: "rank-rb-bucky-irving", name: "Bucky Irving", team: "Tampa Bay Buccaneers", position: "RB", rank: 4, games: 9, rushingYards: 825, rushingTouchdowns: 7, receptions: 22, receivingYards: 106, receivingTouchdowns: 1 },
  { id: "rank-rb-james-cook", name: "James Cook III", team: "Buffalo Bills", position: "RB", rank: 5, games: 7, rushingYards: 707, rushingTouchdowns: 7, receptions: 12, receivingYards: 110, receivingTouchdowns: 0 },
  { id: "rank-rb-jaylen-warren", name: "Jaylen Warren", team: "Pittsburgh Steelers", position: "RB", rank: 6, games: 8, rushingYards: 704, rushingTouchdowns: 2, receptions: 25, receivingYards: 294, receivingTouchdowns: 1 },
  { id: "rank-rb-derrick-henry", name: "Derrick Henry", team: "Baltimore Ravens", position: "RB", rank: 7, games: 9, rushingYards: 689, rushingTouchdowns: 8, receptions: 12, receivingYards: 75, receivingTouchdowns: 1 },
  { id: "rank-rb-jonathan-taylor", name: "Jonathan Taylor", team: "Indianapolis Colts", position: "RB", rank: 8, games: 9, rushingYards: 656, rushingTouchdowns: 8, receptions: 26, receivingYards: 220, receivingTouchdowns: 0 },
  { id: "rank-rb-javonte-williams", name: "Javonte Williams", team: "Dallas Cowboys", position: "RB", rank: 9, games: 9, rushingYards: 629, rushingTouchdowns: 9, receptions: 24, receivingYards: 127, receivingTouchdowns: 1 },
  { id: "rank-rb-chuba-hubbard", name: "Chuba Hubbard", team: "Carolina Panthers", position: "RB", rank: 10, games: 8, rushingYards: 619, rushingTouchdowns: 5, receptions: 26, receivingYards: 167, receivingTouchdowns: 2 },

  { id: "rank-wr-jaxon-smith-njigba", name: "Jaxon Smith-Njigba", team: "Seattle Seahawks", position: "WR", rank: 1, games: 9, receptions: 71, receivingYards: 1036, receivingTouchdowns: 9, rushingYards: 29, rushingTouchdowns: 0 },
  { id: "p4", name: "CeeDee Lamb", team: "Dallas Cowboys", position: "WR", rank: 2, games: 9, receptions: 70, receivingYards: 904, receivingTouchdowns: 7, rushingYards: -6, rushingTouchdowns: 0 },
  { id: "rank-wr-christian-watson", name: "Christian Watson", team: "Green Bay Packers", position: "WR", rank: 3, games: 9, receptions: 49, receivingYards: 879, receivingTouchdowns: 7 },
  { id: "rank-wr-matthew-golden", name: "Matthew Golden", team: "Green Bay Packers", position: "WR", rank: 4, games: 9, receptions: 53, receivingYards: 783, receivingTouchdowns: 5 },
  { id: "rank-wr-tee-higgins", name: "Tee Higgins", team: "Cincinnati Bengals", position: "WR", rank: 5, games: 8, receptions: 48, receivingYards: 758, receivingTouchdowns: 6 },
  { id: "rank-wr-chris-olave", name: "Chris Olave", team: "New Orleans Saints", position: "WR", rank: 6, games: 8, receptions: 56, receivingYards: 734, receivingTouchdowns: 2 },
  { id: "rank-wr-puka-nacua", name: "Puka Nacua", team: "Los Angeles Rams", position: "WR", rank: 7, games: 7, receptions: 70, receivingYards: 715, receivingTouchdowns: 4, rushingYards: 41, rushingTouchdowns: 1 },
  { id: "rank-wr-drake-london", name: "Drake London", team: "Atlanta Falcons", position: "WR", rank: 8, games: 9, receptions: 44, receivingYards: 692, receivingTouchdowns: 1, rushingYards: 4, rushingTouchdowns: 0 },
  { id: "rank-wr-amon-ra-st-brown", name: "Amon-Ra St. Brown", team: "Detroit Lions", position: "WR", rank: 9, games: 8, receptions: 61, receivingYards: 657, receivingTouchdowns: 5, rushingYards: 9, rushingTouchdowns: 0 },
  { id: "rank-wr-malik-nabers", name: "Malik Nabers", team: "New York Giants", position: "WR", rank: 10, games: 8, receptions: 53, receivingYards: 648, receivingTouchdowns: 2 },

  { id: "rank-te-brock-bowers", name: "Brock Bowers", team: "Las Vegas Raiders", position: "TE", rank: 1, games: 7, receptions: 48, receivingYards: 658, receivingTouchdowns: 6, rushingYards: 2, rushingTouchdowns: 0 },
  { id: "rank-te-trey-mcbride", name: "Trey McBride", team: "Arizona Cardinals", position: "TE", rank: 2, games: 9, receptions: 73, receivingYards: 598, receivingTouchdowns: 5 },
  { id: "rank-te-george-kittle", name: "George Kittle", team: "San Francisco 49ers", position: "TE", rank: 3, games: 8, receptions: 38, receivingYards: 483, receivingTouchdowns: 5 },
  { id: "p7", name: "Travis Kelce", team: "Kansas City Chiefs", position: "TE", rank: 4, games: 8, receptions: 33, receivingYards: 482, receivingTouchdowns: 2, rushingYards: 1, rushingTouchdowns: 1 },
  { id: "rank-te-harold-fannin", name: "Harold Fannin Jr.", team: "Cleveland Browns", position: "TE", rank: 5, games: 9, receptions: 37, receivingYards: 453, receivingTouchdowns: 4 },
  { id: "rank-te-isaiah-likely", name: "Isaiah Likely", team: "New York Giants", position: "TE", rank: 6, games: 8, receptions: 46, receivingYards: 448, receivingTouchdowns: 6 },
  { id: "rank-te-dalton-kincaid", name: "Dalton Kincaid", team: "Buffalo Bills", position: "TE", rank: 7, games: 7, receptions: 27, receivingYards: 401, receivingTouchdowns: 2 },
  { id: "rank-te-sam-laporta", name: "Sam LaPorta", team: "Detroit Lions", position: "TE", rank: 8, games: 8, receptions: 35, receivingYards: 399, receivingTouchdowns: 3, rushingYards: 2, rushingTouchdowns: 0 },
  { id: "rank-te-michael-mayer", name: "Michael Mayer", team: "Las Vegas Raiders", position: "TE", rank: 9, games: 9, receptions: 39, receivingYards: 388, receivingTouchdowns: 1 },
  { id: "rank-te-dalton-schultz", name: "Dalton Schultz", team: "Houston Texans", position: "TE", rank: 10, games: 8, receptions: 35, receivingYards: 364, receivingTouchdowns: 0 }
];
