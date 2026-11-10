"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import PlayerComparisonCharts from "./components/PlayerComparisonCharts";
import { UserProgress, userProgressSchema } from "@/lib/progress";
import { leaderboardConfig, topTenPlayers2026, type LeaderboardPosition } from "@/lib/top-ten-2026";
import { calculate2026SiteRatings, type SitePlayerRating } from "@/lib/player-ratings";

type View = "Overview" | "Players" | "Matchup lab" | "Playbook" | "Lineups" | "Film room";
type Player = {
  id: string; name: string; team: string; position: string; number: string; games: number;
  passingYards: number | null; passingTouchdowns: number | null; interceptions: number | null; passerRating: number | null;
  rushingYards: number | null; rushingTouchdowns: number | null;
  receptions: number | null; receivingYards: number | null; receivingTouchdowns: number | null;
  statsUrl: string; initials: string; note: string; positionRank?: number;
};
type Play = { id: string; name: string; formation: string; personnel: string; concept: string; situation: string; note: string; tags?: string[] };
type Lineup = { id: string; name: string; format: string; quarterback: string; runningBack: string; receiver: string; tightEnd: string; note: string };
type ModalState = { kind: "play" | "lineup"; item?: Play | Lineup } | null;

const originalPlayers: Player[] = [
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
const rankedPlayerProfiles: Player[] = topTenPlayers2026.map(ranked => {
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
const seasonPlayers: Player[] = [
  ...rankedPlayerProfiles,
  ...originalPlayers.filter(player => !topTenNames.has(player.name))
];
const statsSourceUrl = "https://www.nfl.com/stats/player-stats";
const statsCheckedAt = "November 9, 2026";

function primaryStat(player: Player) {
  if (!player.games) return { label: "2026 status", value: "No stats" };
  if (player.position === "QB") return { label: "Pass yds", value: player.passingYards?.toLocaleString("en-US") ?? "—" };
  if (player.position === "RB") return { label: "Rush yds", value: player.rushingYards?.toLocaleString("en-US") ?? "—" };
  return { label: "Rec yds", value: player.receivingYards?.toLocaleString("en-US") ?? "—" };
}
function leaderboardStat(player: Player) {
  if (player.position === "QB") return { label: "Pass yards", value: player.passingYards?.toLocaleString("en-US") ?? "—" };
  if (player.position === "RB") return { label: "Rush yards", value: player.rushingYards?.toLocaleString("en-US") ?? "—" };
  return { label: "Receiving yards", value: player.receivingYards?.toLocaleString("en-US") ?? "—" };
}
function SiteRatingDisplay({ rating, position, compact = false }: { rating: SitePlayerRating; position: string; compact?: boolean }) {
  const metric = leaderboardConfig[position as LeaderboardPosition]?.metric || "2026 stats";
  const accessibleRating = rating === null
    ? "No verified 2026 stats"
    : `${rating} out of 5 stars, based on ${metric.toLowerCase()}`;
  return <div className={`site-rating ${compact ? "compact" : ""}`} aria-label={`Site rating: ${accessibleRating}`}>
    <span className="site-rating-label">Site rating</span>
    {rating === null
      ? <span className="site-rating-unrated">Not rated</span>
      : <>
        <span className="site-rating-stars" aria-hidden="true">{compact
          ? <span className="filled">★</span>
          : [1, 2, 3, 4, 5].map(star => <span key={star} className={star <= rating ? "filled" : ""}>★</span>)}</span>
        <b>{rating}/5</b>
      </>}
    {!compact && <small>2026 {metric.toLowerCase()} vs. same-position players</small>}
  </div>;
}
function primaryYards(player: Player) {
  if (player.position === "QB") return player.passingYards;
  if (player.position === "RB") return player.rushingYards;
  return player.receivingYards;
}
function primaryTouchdowns(player: Player) {
  if (player.position === "QB") return (player.passingTouchdowns ?? 0) + (player.rushingTouchdowns ?? 0);
  if (player.position === "RB") return (player.rushingTouchdowns ?? 0) + (player.receivingTouchdowns ?? 0);
  return player.receivingTouchdowns ?? 0;
}
function playerStatRows(player: Player) {
  if (!player.games) return [{ label: "2026 line", value: "No stats reported" }];
  if (player.position === "QB") return [
    { label: "Pass yards", value: player.passingYards?.toLocaleString("en-US") ?? "—" },
    { label: "TD / INT", value: `${player.passingTouchdowns ?? 0} / ${player.interceptions ?? 0}` },
    { label: "Pass rating", value: player.passerRating?.toFixed(1) ?? "—" }
  ];
  if (player.position === "RB") return [
    { label: "Rush yards", value: player.rushingYards?.toLocaleString("en-US") ?? "—" },
    { label: "Rush TD", value: String(player.rushingTouchdowns ?? 0) },
    { label: "Rec yards", value: player.receivingYards?.toLocaleString("en-US") ?? "—" }
  ];
  return [
    { label: "Rec yards", value: player.receivingYards?.toLocaleString("en-US") ?? "—" },
    { label: "Receptions", value: String(player.receptions ?? 0) },
    { label: "Rec TD", value: String(player.receivingTouchdowns ?? 0) }
  ];
}
const demoPlays: Play[] = [
  { id: "d1", name: "Blue Orbit", formation: "Gun Trips Right", personnel: "11 personnel", concept: "Choice / Sail", situation: "2nd & medium", note: "Read the nickel leverage. Alert the boundary fade if the safety rotates down.", tags: ["quick game", "coverage read"] },
  { id: "d2", name: "Gold Rush", formation: "I-Form Close", personnel: "21 personnel", concept: "Outside Zone", situation: "Red zone", note: "Sell split flow before the back presses the outside hip.", tags: ["run game", "red zone"] }
];
const demoLineups: Lineup[] = [
  { id: "l1", name: "Sunday Pressure", format: "Fantasy · PPR", quarterback: "Justin Herbert", runningBack: "Christian McCaffrey", receiver: "CeeDee Lamb", tightEnd: "Travis Kelce", note: "High-floor core with a premium receiving back." }
];
const localProgressKeys = ["gc-plays", "gc-lineups", "gc-favorites", "gc-player-tags", "gc-team-players", "gc-player-ratings", "gc-theme", "gc-poll", "gc-recent-players", "gc-fan-tools"];
function createDefaultProgress(): UserProgress {
  return {
    version: 1,
    plays: demoPlays,
    lineups: demoLineups,
    favorites: [],
    playerTags: {},
    teamPlayers: [],
    playerRatings: {},
    darkMode: false,
    pollVotes: { chargers: 0, chiefs: 0 },
    userVote: "",
    recentlyViewed: []
  };
}
function readBrowserProgress(): UserProgress {
  const defaults = createDefaultProgress();
  const savedPlays = localStorage.getItem("gc-plays");
  const savedLineups = localStorage.getItem("gc-lineups");
  const savedFavorites = localStorage.getItem("gc-favorites");
  const savedPlayerTags = localStorage.getItem("gc-player-tags");
  const savedTeamPlayers = localStorage.getItem("gc-team-players");
  const savedRatings = localStorage.getItem("gc-player-ratings");
  const savedTheme = localStorage.getItem("gc-theme");
  const savedPoll = localStorage.getItem("gc-poll");
  const savedRecent = localStorage.getItem("gc-recent-players");
  const savedFanTools = localStorage.getItem("gc-fan-tools");
  const previousFanTools = savedFanTools ? JSON.parse(savedFanTools) as {
    favorites?: string[];
    ratings?: Record<string, number>;
    tags?: Record<string, string[]>;
    recent?: string[];
    theme?: "light" | "dark";
  } : null;
  const poll = savedPoll ? JSON.parse(savedPoll) as { votes?: { chargers?: number; chiefs?: number }; choice?: string } : null;
  const raw = {
    ...defaults,
    plays: savedPlays ? JSON.parse(savedPlays) as Play[] : defaults.plays,
    lineups: savedLineups ? JSON.parse(savedLineups) as Lineup[] : defaults.lineups,
    favorites: savedFavorites ? JSON.parse(savedFavorites) as string[] : previousFanTools?.favorites || defaults.favorites,
    playerTags: savedPlayerTags ? JSON.parse(savedPlayerTags) as Record<string, string[]> : previousFanTools?.tags || defaults.playerTags,
    teamPlayers: savedTeamPlayers ? JSON.parse(savedTeamPlayers) as string[] : defaults.teamPlayers,
    playerRatings: savedRatings ? JSON.parse(savedRatings) as Record<string, number> : previousFanTools?.ratings || defaults.playerRatings,
    darkMode: savedTheme ? savedTheme === "dark" : previousFanTools?.theme === "dark" || defaults.darkMode,
    pollVotes: poll?.votes ? {
      chargers: Number(poll.votes.chargers) || 0,
      chiefs: Number(poll.votes.chiefs) || 0
    } : defaults.pollVotes,
    userVote: poll?.choice === "chargers" || poll?.choice === "chiefs" ? poll.choice : "",
    recentlyViewed: savedRecent ? JSON.parse(savedRecent) as string[] : previousFanTools?.recent || defaults.recentlyViewed
  };
  const parsed = userProgressSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Browser progress is not valid.");
  return parsed.data;
}
function mergeProgress(guest: UserProgress, account: UserProgress): UserProgress {
  const mergeById = <T extends { id: string }>(guestItems: T[], accountItems: T[]) => {
    const merged = new Map<string, T>();
    for (const item of [...guestItems, ...accountItems]) merged.set(item.id, item);
    return [...merged.values()];
  };
  return {
    ...account,
    plays: mergeById(guest.plays, account.plays),
    lineups: mergeById(guest.lineups, account.lineups),
    favorites: [...new Set([...guest.favorites, ...account.favorites])],
    playerTags: { ...guest.playerTags, ...account.playerTags },
    teamPlayers: [...new Set([...guest.teamPlayers, ...account.teamPlayers])],
    playerRatings: { ...guest.playerRatings, ...account.playerRatings },
    recentlyViewed: [...new Set([...account.recentlyViewed, ...guest.recentlyViewed])].slice(0, 5)
  };
}
const experts = [
  { name: "The Play Caller", role: "Offensive coordinator lens", text: "Build the opening script around motion to identify man coverage. Give the quarterback a fast answer before asking the protection to hold up.", pick: "Offensive rhythm" },
  { name: "The Coverage Tech", role: "Defensive backfield lens", text: "Show two-high, then spin late. Make the offense confirm the post-snap picture and rally to short completions instead of gifting explosives.", pick: "Late rotation" },
  { name: "The Trench Report", role: "Line play lens", text: "The matchup is won by the first step, not the highlight. A wide alignment can create a clean inside counter if the tackle oversets.", pick: "Inside counter" },
  { name: "The Numbers Desk", role: "Efficiency lens", text: "Early-down success keeps the call sheet open. Stay ahead of the sticks and the offense can preserve its full menu on third down.", pick: "Stay on schedule" },
  { name: "The Fantasy Angle", role: "Usage lens", text: "Volume is the signal. Routes and touches in high-value areas matter more than last week's touchdown; track the role before chasing the result.", pick: "Target share" },
  { name: "The Film Room", role: "Player development lens", text: "Watch the eyes and the feet together. When the quarterback resets cleanly after the first read, the second window opens on time.", pick: "Rhythm + reset" }
];
const filmPrompts = [
  "When the defense rotates late, which receiver gets the cleanest leverage—and how does the quarterback's footwork show he saw it?",
  "Watch the nickel after the snap: does the run fit open a cutback lane, or does the safety close it?",
  "On third down, which route combination gives the quarterback a clear answer against a two-high shell?",
  "Track the left tackle's first two steps. Is the edge rush winning with speed, or setting up an inside counter?"
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    users: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6",
    compare: "M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M14 14l7 7M21 14v7h-7M10 10 3 3m0 0v7m0-7h7",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    lineup: "M3 4h18v16H3zM7 8h4M7 12h10M7 16h7M17 8h1",
    film: "M4 4h16v16H4zM8 4v4m8-4v4M8 16v4m8-4v4M4 8h16M4 16h16",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
    plus: "M12 5v14M5 12h14",
    arrow: "M5 12h14m-7-7 7 7-7 7",
    close: "M18 6 6 18M6 6l12 12",
    chart: "M3 3v18h18M7 14l4-4 4 4 6-7",
    star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z",
    moon: "M20.8 13.2A8.5 8.5 0 0 1 10.8 3.2 8.5 8.5 0 1 0 20.8 13.2z",
    sun: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    play: "m8 5 12 7-12 7V5z",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z",
    trash: "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z",
    trend: "M3 17l6-6 4 4 8-8m-6 0h6v6"
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.grid} /></svg>;
}

function Modal({ title, subtitle, onClose, children, footer }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="dialog-header"><div><h3 id="dialog-title">{title}</h3><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={15} /></button></header>
      <div className="dialog-body">{children}</div>{footer && <footer className="dialog-footer">{footer}</footer>}
    </section>
  </div>;
}

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const accountUserId = isSignedIn ? user?.id ?? null : null;
  const [view, setView] = useState<View>("Overview");
  const [players, setPlayers] = useState(seasonPlayers);
  const [plays, setPlays] = useState(demoPlays);
  const [lineups, setLineups] = useState(demoLineups);
  const [ready, setReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudOwnerId, setCloudOwnerId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"loading" | "guest" | "saving" | "saved" | "error">("loading");
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("All positions");
  const [leaderboardPosition, setLeaderboardPosition] = useState<LeaderboardPosition>("QB");
  const [selected, setSelected] = useState<string[]>(["p1", "p2"]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const [editName, setEditName] = useState("");
  const [formError, setFormError] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playerTags, setPlayerTags] = useState<Record<string, string[]>>({});
  const [teamPlayers, setTeamPlayers] = useState<string[]>([]);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [playerRatings, setPlayerRatings] = useState<Record<string, number>>({});
  const [playerFilter, setPlayerFilter] = useState<"all" | "favorites" | "team">("all");
  const [sortBy, setSortBy] = useState("name");
  const [darkMode, setDarkMode] = useState(false);
  const [pollVotes, setPollVotes] = useState({ chargers: 0, chiefs: 0 });
  const [userVote, setUserVote] = useState<"" | "chargers" | "chiefs">("");
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [playerDetail, setPlayerDetail] = useState<Player | null>(null);
  const [randomPlayerId, setRandomPlayerId] = useState("");
  const [filmPrompt, setFilmPrompt] = useState(filmPrompts[0]);
  const [playTagFilter, setPlayTagFilter] = useState("All tags");
  const bootstrappedRef = useRef(false);
  const authInitializedRef = useRef(false);
  const lastAccountIdRef = useRef<string | null>(null);
  const hasAuthenticatedThisTabRef = useRef(false);
  const hasGuestProgressRef = useRef(false);
  const skipLocalWriteRef = useRef(false);
  const activeAccountIdRef = useRef<string | null>(accountUserId);
  activeAccountIdRef.current = accountUserId;

  const progressSnapshot = useMemo<UserProgress>(() => ({
    version: 1,
    plays,
    lineups,
    favorites,
    playerTags,
    teamPlayers,
    playerRatings,
    darkMode,
    pollVotes,
    userVote,
    recentlyViewed
  }), [plays, lineups, favorites, playerTags, teamPlayers, playerRatings, darkMode, pollVotes, userVote, recentlyViewed]);
  const progressRef = useRef(progressSnapshot);
  progressRef.current = progressSnapshot;

  const applyProgress = (progress: UserProgress) => {
    setPlays(progress.plays.map(play => ({ ...play, tags: Array.isArray(play.tags) ? play.tags : [] })));
    setLineups(progress.lineups);
    setFavorites(progress.favorites);
    setPlayerTags(progress.playerTags || {});
    setTeamPlayers(progress.teamPlayers);
    setPlayerRatings(progress.playerRatings);
    setDarkMode(progress.darkMode);
    setPollVotes(progress.pollVotes);
    setUserVote(progress.userVote);
    setRecentlyViewed(progress.recentlyViewed);
  };

  useEffect(() => {
    if (!isLoaded || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    try {
      const stored = readBrowserProgress();
      applyProgress(stored);
      hasGuestProgressRef.current = JSON.stringify(stored) !== JSON.stringify(createDefaultProgress());
    } catch {
      setToast("Saved items could not be loaded. Your current session is still available.");
      hasGuestProgressRef.current = false;
    }
    setReady(true);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!authInitializedRef.current) {
      authInitializedRef.current = true;
      lastAccountIdRef.current = accountUserId;
      return;
    }
    if (lastAccountIdRef.current === accountUserId) return;

    const previousAccountId = lastAccountIdRef.current;
    lastAccountIdRef.current = accountUserId;
    setCloudReady(false);
    if (previousAccountId) {
      skipLocalWriteRef.current = true;
      if (accountUserId) {
        applyProgress(createDefaultProgress());
        setSyncStatus("loading");
      } else {
        try {
          const guestProgress = readBrowserProgress();
          applyProgress(guestProgress);
          hasGuestProgressRef.current = JSON.stringify(guestProgress) !== JSON.stringify(createDefaultProgress());
        } catch {
          applyProgress(createDefaultProgress());
          hasGuestProgressRef.current = false;
        }
        setSyncStatus("guest");
      }
      setCloudOwnerId(null);
      hasAuthenticatedThisTabRef.current = true;
    } else if (accountUserId) {
      setSyncStatus("loading");
    } else {
      setSyncStatus("guest");
      setCloudOwnerId(null);
    }
  }, [isLoaded, accountUserId]);

  useEffect(() => {
    if (!ready || !isLoaded || !accountUserId) return;
    let cancelled = false;
    setCloudReady(false);
    setSyncStatus("loading");

    const loadAccountProgress = async () => {
      try {
        const response = await fetch("/api/progress", { cache: "no-store" });
        if (!response.ok) throw new Error("Account progress could not be loaded.");
        const result = await response.json() as { progress: unknown | null };
        const cloudParsed = result.progress === null ? null : userProgressSchema.safeParse(result.progress);
        if (result.progress !== null && (!cloudParsed || !cloudParsed.success)) {
          throw new Error("Saved account progress has an invalid format.");
        }

        const isFirstAccountOnThisTab = !hasAuthenticatedThisTabRef.current;
        const shouldImportGuest = isFirstAccountOnThisTab && hasGuestProgressRef.current;
        const cloudProgress = cloudParsed?.success ? cloudParsed.data : null;
        const resolvedProgress = cloudProgress
          ? shouldImportGuest ? mergeProgress(progressRef.current, cloudProgress) : cloudProgress
          : shouldImportGuest ? progressRef.current : createDefaultProgress();

        if (!cloudProgress || shouldImportGuest) {
          const saveResponse = await fetch("/api/progress", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ progress: resolvedProgress })
          });
          if (!saveResponse.ok) throw new Error("Account progress could not be saved.");
        }
        if (cancelled) return;

        applyProgress(resolvedProgress);
        if (isFirstAccountOnThisTab) {
          for (const key of localProgressKeys) localStorage.removeItem(key);
          hasGuestProgressRef.current = false;
        }
        hasAuthenticatedThisTabRef.current = true;
        setCloudOwnerId(accountUserId);
        setCloudReady(true);
        setSyncStatus("saved");
        if (shouldImportGuest) setToast("Your existing progress has been saved to your account.");
      } catch (error) {
        if (cancelled) return;
        console.error("Account progress sync failed.", error);
        setSyncStatus("error");
        setCloudReady(false);
      }
    };

    void loadAccountProgress();
    return () => { cancelled = true; };
  }, [ready, isLoaded, accountUserId, syncAttempt]);

  useEffect(() => {
    if (!ready || !isLoaded || isSignedIn) return;
    if (skipLocalWriteRef.current) {
      skipLocalWriteRef.current = false;
      return;
    }
    try {
      localStorage.setItem("gc-plays", JSON.stringify(plays));
      localStorage.setItem("gc-lineups", JSON.stringify(lineups));
      localStorage.setItem("gc-favorites", JSON.stringify(favorites));
      localStorage.setItem("gc-player-tags", JSON.stringify(playerTags));
      localStorage.setItem("gc-team-players", JSON.stringify(teamPlayers));
      localStorage.setItem("gc-player-ratings", JSON.stringify(playerRatings));
      localStorage.setItem("gc-theme", darkMode ? "dark" : "light");
      localStorage.setItem("gc-poll", JSON.stringify({ votes: pollVotes, choice: userVote }));
      localStorage.setItem("gc-recent-players", JSON.stringify(recentlyViewed));
      hasGuestProgressRef.current = JSON.stringify(progressSnapshot) !== JSON.stringify(createDefaultProgress());
    }
    catch { setToast("Browser storage is full. Changes may not persist."); }
  }, [plays, lineups, favorites, playerTags, teamPlayers, playerRatings, darkMode, pollVotes, userVote, recentlyViewed, progressSnapshot, ready, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!ready || !isLoaded || !isSignedIn || !accountUserId || !cloudReady || cloudOwnerId !== accountUserId) return;
    const savingForAccount = accountUserId;
    const timer = window.setTimeout(async () => {
      if (activeAccountIdRef.current !== savingForAccount) return;
      setSyncStatus("saving");
      try {
        const response = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress: progressSnapshot })
        });
        if (!response.ok) throw new Error("Account progress could not be saved.");
        if (activeAccountIdRef.current === savingForAccount) setSyncStatus("saved");
      } catch (error) {
        if (activeAccountIdRef.current !== savingForAccount) return;
        console.error("Account progress save failed.", error);
        setSyncStatus("error");
        setToast("Your changes could not sync. Check your connection and try again.");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [progressSnapshot, ready, isLoaded, isSignedIn, accountUserId, cloudReady, cloudOwnerId]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPlayers = useMemo(() => players.filter(player => {
    const matchesText = `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(query.toLowerCase());
    const matchesGroup = playerFilter === "all"
      || (playerFilter === "favorites" && favorites.includes(player.id))
      || (playerFilter === "team" && teamPlayers.includes(player.id));
    return matchesText && (position === "All positions" || player.position === position) && matchesGroup;
  }).sort((a, b) => {
    if (sortBy === "yards") {
      const aYards = primaryYards(a);
      const bYards = primaryYards(b);
      if (aYards === null) return bYards === null ? a.name.localeCompare(b.name) : 1;
      if (bYards === null) return -1;
      return bYards - aYards;
    }
    if (sortBy === "touchdowns") return (b.games ? primaryTouchdowns(b) : -1) - (a.games ? primaryTouchdowns(a) : -1);
    return a.name.localeCompare(b.name);
  }), [players, query, position, playerFilter, favorites, teamPlayers, sortBy]);
  const leaderboardPlayers = useMemo(() => players
    .filter(player => player.position === leaderboardPosition && player.positionRank !== undefined)
    .sort((a, b) => (a.positionRank || 0) - (b.positionRank || 0))
    .slice(0, 10), [players, leaderboardPosition]);
  const siteRatings = useMemo(() => calculate2026SiteRatings(players), [players]);
  const filteredPlays = useMemo(() => plays.filter(play => playTagFilter === "All tags" || play.tags?.includes(playTagFilter)), [plays, playTagFilter]);
  const playTags = [...new Set(plays.flatMap(play => play.tags || []))].sort((a, b) => a.localeCompare(b));
  const totalPollVotes = pollVotes.chargers + pollVotes.chiefs;
  const chargersPercent = totalPollVotes ? Math.round(pollVotes.chargers / totalPollVotes * 100) : 0;
  const chiefsPercent = totalPollVotes ? 100 - chargersPercent : 0;
  const comparePlayers = selected.map(id => players.find(player => player.id === id)).filter((player): player is Player => Boolean(player));
  const chartPlayers = comparePlayers.length === 2 ? comparePlayers : players.slice(0, 2);
  const openEditor = (kind: "play" | "lineup", item?: Play | Lineup) => {
    setFormError("");
    setModal({ kind, item });
    if (!item) { setEditName(""); setFormValues({}); return; }
    setEditName(item.name);
    if (kind === "play") {
      const play = item as Play;
      setFormValues({ formation: play.formation, personnel: play.personnel, concept: play.concept, situation: play.situation, note: play.note, tags: (play.tags || []).join(", ") });
    } else {
      const lineup = item as Lineup;
      setFormValues({ format: lineup.format, quarterback: lineup.quarterback, runningBack: lineup.runningBack, receiver: lineup.receiver, tightEnd: lineup.tightEnd, note: lineup.note });
    }
  };
  const saveItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editName.trim()) { setFormError("Give this entry a name before saving."); return; }
    if (modal?.kind === "play") {
      const next: Play = { id: (modal.item as Play | undefined)?.id || `play-${Date.now()}`, name: editName.trim(), formation: formValues.formation || "Shotgun", personnel: formValues.personnel || "11 personnel", concept: formValues.concept || "Quick game", situation: formValues.situation || "Any down", note: formValues.note || "", tags: (formValues.tags || "").split(",").map(tag => tag.trim().toLowerCase()).filter(Boolean) };
      setPlays(old => modal.item ? old.map(item => item.id === next.id ? next : item) : [next, ...old]);
      setToast(modal.item ? "Play updated in your playbook." : "Play added to your playbook.");
    }
    if (modal?.kind === "lineup") {
      const next: Lineup = { id: (modal.item as Lineup | undefined)?.id || `lineup-${Date.now()}`, name: editName.trim(), format: formValues.format || "Custom", quarterback: formValues.quarterback || "—", runningBack: formValues.runningBack || "—", receiver: formValues.receiver || "—", tightEnd: formValues.tightEnd || "—", note: formValues.note || "" };
      setLineups(old => modal.item ? old.map(item => item.id === next.id ? next : item) : [next, ...old]);
      setToast(modal.item ? "Lineup updated." : "Lineup created.");
    }
    setModal(null);
  };
  const removeItem = (kind: "play" | "lineup", id: string) => {
    if (!window.confirm(`Delete this item? It will be removed ${isSignedIn ? "from your account" : "from this browser"}.`)) return;
    if (kind === "play") setPlays(old => old.filter(item => item.id !== id));
    else setLineups(old => old.filter(item => item.id !== id));
    setToast("Item deleted.");
  };
  const togglePlayer = (id: string) => {
    setSelected(old => {
      if (old.includes(id)) return old.filter(item => item !== id);
      if (old.length >= 2) { setToast("Choose two players for a head-to-head."); return old; }
      return [...old, id];
    });
  };
  const toggleFavorite = (id: string) => {
    const isFavorite = favorites.includes(id);
    setFavorites(old => isFavorite ? old.filter(playerId => playerId !== id) : [...old, id]);
    setToast(isFavorite ? "Removed from your favorites." : "Added to your favorites.");
  };
  const toggleTeamPlayer = (id: string) => {
    const alreadyAdded = teamPlayers.includes(id);
    const playerName = players.find(player => player.id === id)?.name || "Player";
    setTeamPlayers(old => alreadyAdded ? old.filter(playerId => playerId !== id) : [...old, id]);
    if (alreadyAdded) {
      setToast(`${playerName} removed from your team.`);
    } else {
      setToast(isSignedIn ? `${playerName} added. Your team will sync to your account.` : `${playerName} added. Your team is saved on this device.`);
    }
  };
  const openPlayer = (player: Player) => {
    setPlayerDetail(player);
    setRecentlyViewed(old => [player.id, ...old.filter(id => id !== player.id)].slice(0, 5));
  };
  const pickRandomPlayer = () => {
    if (!players.length) return;
    const choices = players.filter(player => player.id !== randomPlayerId);
    const next = choices[Math.floor(Math.random() * choices.length)] || players[0];
    setRandomPlayerId(next.id);
  };
  const castVote = (choice: "chargers" | "chiefs") => {
    if (userVote) return;
    setPollVotes(old => ({ ...old, [choice]: old[choice] + 1 }));
    setUserVote(choice);
    setToast("Your local poll vote is saved.");
  };
  const downloadCsv = (kind: "plays" | "lineups") => {
    const rows = kind === "plays" ? [
      ["Name", "Formation", "Personnel", "Concept", "Situation", "Tags", "Note"],
      ...plays.map(play => [play.name, play.formation, play.personnel, play.concept, play.situation, (play.tags || []).join(" | "), play.note])
    ] : [
      ["Name", "Format", "Quarterback", "Running back", "Receiver", "Tight end", "Note"],
      ...lineups.map(lineup => [lineup.name, lineup.format, lineup.quarterback, lineup.runningBack, lineup.receiver, lineup.tightEnd, lineup.note])
    ];
    const csv = rows.map(row => row.map(value => {
      const text = String(value);
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `gridiron-${kind}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`${kind === "plays" ? "Playbook" : "Lineups"} exported as CSV.`);
  };
  const setRating = (playerId: string, rating: number) => {
    setPlayerRatings(old => ({ ...old, [playerId]: rating }));
    setToast(isSignedIn ? "Your player rating will sync to your account." : "Your player rating is saved on this device.");
  };
  const addPlayerTag = (playerId: string) => {
    const tag = (tagDrafts[playerId] || "").trim().replace(/\s+/g, " ");
    if (!tag) { setToast("Enter a tag before adding it."); return; }
    if (tag.length > 20) { setToast("Tags must be 20 characters or fewer."); return; }
    const current = playerTags[playerId] || [];
    if (current.some(existing => existing.toLowerCase() === tag.toLowerCase())) { setToast("That tag is already on this player."); return; }
    if (current.length >= 5) { setToast("A player can have up to five tags."); return; }
    setPlayerTags(old => ({ ...old, [playerId]: [...(old[playerId] || []), tag] }));
    setTagDrafts(old => ({ ...old, [playerId]: "" }));
    setToast(isSignedIn ? `Tag added for your account: ${tag}` : `Tag saved on this device: ${tag}`);
  };
  const downloadPlayerCsv = () => {
    const rows = [
      ["Name", "Team", "Position", "Games", "Primary stat", "Favorite", "Fan rating", "Tags"],
      ...filteredPlayers.map(player => {
        const stat = primaryStat(player);
        return [player.name, player.team, player.position, String(player.games), `${stat.label}: ${stat.value}`, favorites.includes(player.id) ? "Yes" : "No", playerRatings[player.id] ? `${playerRatings[player.id]}/5` : "", (playerTags[player.id] || []).join(" | ")];
      })
    ];
    const csv = rows.map(row => row.map(value => {
      const text = String(value);
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "gridiron-player-scouting.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`Exported ${filteredPlayers.length} player${filteredPlayers.length === 1 ? "" : "s"} to CSV.`);
  };
  const newFilmPrompt = () => {
    const choices = filmPrompts.filter(prompt => prompt !== filmPrompt);
    setFilmPrompt(choices[Math.floor(Math.random() * choices.length)] || filmPrompts[0]);
  };
  const goto = (next: View) => { setView(next); setQuery(""); };
  const resource = modal?.kind === "play" ? "play" : "lineup";
  const isEditing = Boolean(modal?.item);

  const navItems: { title: View; icon: string }[] = [
    { title: "Overview", icon: "grid" }, { title: "Players", icon: "users" }, { title: "Matchup lab", icon: "compare" }, { title: "Playbook", icon: "book" }, { title: "Lineups", icon: "lineup" }, { title: "Film room", icon: "film" }
  ];
  const syncLabel = !isLoaded
    ? "CHECKING ACCOUNT"
    : isSignedIn
      ? syncStatus === "saving" ? "SYNCING PROGRESS" : syncStatus === "error" ? "SYNC NEEDS ATTENTION" : syncStatus === "loading" ? "LOADING PROGRESS" : "ACCOUNT SAVED"
      : "GUEST MODE";
  const accountName = user?.fullName || user?.firstName || "Gridiron Fan";

  if (isLoaded && isSignedIn && accountUserId && cloudOwnerId !== accountUserId) {
    return <main className="account-loading-shell">
      <section className="account-loading-card">
        <img src="/gridiron-mark.svg" alt="" width="48" height="48" />
        <div className="eyebrow">Gridiron Central account</div>
        <h1>{syncStatus === "error" ? "Progress could not sync" : "Loading your saved progress"}</h1>
        <p>{syncStatus === "error" ? "Your account is signed in, but saved data could not be reached. Retry the sync or continue as a guest." : "Your playbook, lineups, favorites, and ratings are being loaded securely."}</p>
        {syncStatus === "error"
          ? <div className="account-loading-actions"><button className="primary-button" onClick={() => setSyncAttempt(value => value + 1)}>Retry sync</button><button className="secondary-button" onClick={() => void signOut({ redirectUrl: "/" })}>Continue as guest</button></div>
          : <span className="sync-spinner" aria-label="Loading" />}
      </section>
    </main>;
  }

  return <div className={`app-shell ${darkMode ? "dark-mode" : ""}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Icon name="shield" size={21} /></div><div className="brand-name">GRIDIRON<span>CENTRAL</span></div></div>
      <div className="side-label">Game center</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(item => <button key={item.title} className={`nav-item ${view === item.title ? "active" : ""}`} onClick={() => goto(item.title)} aria-current={view === item.title ? "page" : undefined}><span className="nav-icon"><Icon name={item.icon} size={17} /></span>{item.title}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="side-label">Season snapshot</div>
        <div className="season-card"><div className="season-label">Regular season stats</div><div className="season-value">2026 <span style={{ color: "var(--gold)", fontSize: 11 }}>NFL.COM</span></div><div className="season-status"><i className="dot" /> Checked Nov 9, 2026</div></div>
        <div className="profile"><div className="profile-avatar">{isSignedIn ? (user?.firstName?.charAt(0) || "F") : "GC"}</div><div><div className="profile-name">{isSignedIn ? accountName : "Gridiron Guest"}</div><div className="profile-sub">{isSignedIn ? syncStatus === "saved" ? "Progress saved to account" : syncStatus === "saving" ? "Syncing progress…" : syncStatus === "error" ? "Sync needs attention" : "Loading saved progress" : "Guest · saved on this device"}</div></div></div>
      </div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">GRIDIRON CENTRAL <span style={{ margin: "0 7px", color: "#c0cbd3" }}>/</span> <b>{view.toUpperCase()}</b></div><div className="top-actions"><span className={`live-pill ${syncStatus === "error" ? "sync-error" : ""}`}><i /> {syncLabel}</span>{isLoaded && (isSignedIn ? <><span className="auth-user-label">{accountName}</span><button className="auth-link" onClick={() => void signOut({ redirectUrl: "/" })}>Sign out</button></> : <><Link className="auth-link" href="/sign-in">Sign in</Link><Link className="auth-create" href="/sign-up">Create account</Link></>)}<button className="icon-button" aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"} aria-pressed={darkMode} title={darkMode ? "Light theme" : "Dark theme"} onClick={() => setDarkMode(value => !value)}><Icon name={darkMode ? "sun" : "moon"} size={16} /></button><button className="icon-button" aria-label="Notifications" onClick={() => setToast("You are all caught up.")}><Icon name="bell" size={16} /></button></div></header>
      <div className="content">
        {view === "Overview" && <>
          <section className="hero">
            <div className="hero-copy"><div className="hero-kicker"><span>2026 REGULAR SEASON</span> / NFL.com stats checked Nov 9</div><h1>See the game<br /><em>differently.</em></h1><p>Go beyond the box score. Break down the matchups, build your playbook, and find the edges that change Sundays.</p><button className="hero-cta" onClick={() => goto("Matchup lab")}>OPEN MATCHUP LAB <Icon name="arrow" size={15} /></button></div>
            <div className="hero-note"><b>FILM FIRST. ALWAYS.</b>TACTICAL INSIGHT / FAN-POWERED</div>
          </section>
          <div className="section-head"><div><div className="eyebrow">The lay of the land</div><h2>Sunday, at a glance</h2></div><button className="text-button" onClick={() => goto("Players")}>Explore player directory <Icon name="arrow" size={14} /></button></div>
          <div className="stat-strip">
            <div className="stat-card"><div><div className="stat-label">Player profiles</div><div className="stat-value">{players.length}</div><div className="stat-meta">2026 SEASON SNAPSHOT</div></div><div className="stat-mark"><Icon name="users" size={16} /></div></div>
            <div className="stat-card"><div><div className="stat-label">Your playbook</div><div className="stat-value">{plays.length}</div><div className="stat-meta">SAVED CONCEPTS</div></div><div className="stat-mark"><Icon name="book" size={16} /></div></div>
            <div className="stat-card"><div><div className="stat-label">Lineup boards</div><div className="stat-value">{lineups.length}</div><div className="stat-meta">{isSignedIn ? "ACCOUNT ROSTERS" : "LOCAL ROSTERS"}</div></div><div className="stat-mark"><Icon name="lineup" size={16} /></div></div>
            <div className="stat-card"><div><div className="stat-label">Your favorites</div><div className="stat-value">{favorites.length}</div><div className="stat-meta">SAVED PLAYERS</div></div><div className="stat-mark"><Icon name="star" size={16} /></div></div>
          </div>
          <div className="dashboard-grid">
            <section className="panel"><header className="panel-header"><div><div className="panel-title">Matchup of the week</div><div className="panel-caption">A sample tactical prompt to get your film session started.</div></div><span className="panel-tag">FEATURED</span></header>
              <div className="matchup-feature"><div className="team-side"><div className="team-badge">LAC</div><div><div className="team-meta">AFC WEST</div><div className="team-name">Chargers</div><div className="team-detail">Justin Herbert · QB</div></div></div><div className="versus">VS</div><div className="team-side right"><div className="team-badge">KC</div><div><div className="team-meta">AFC WEST</div><div className="team-name">Chiefs</div><div className="team-detail">Patrick Mahomes · QB</div></div></div></div>
              <div className="match-foot"><small>Focus: pressure answers &amp; coverage rotation</small><button className="thin-button" onClick={() => { setSelected(["p1", "p2"]); goto("Matchup lab"); setComparisonOpen(true); }}>Break it down <Icon name="arrow" size={12} /></button></div>
            </section>
            <section className="panel"><header className="panel-header"><div><div className="panel-title">Player snapshots</div><div className="panel-caption">2026 regular-season lines from the directory.</div></div><Icon name="trend" size={17} /></header><div className="trend-card">
              {players.filter(player => player.games > 0).slice(0, 3).map(player => {
                const stat = primaryStat(player);
                return <div className="trend-row" key={player.id}><span className="trend-number">{player.position}</span><div className="trend-copy"><div className="trend-name">{player.name}</div><div className="trend-meta">{player.team}</div></div><div className="trend-value">{stat.value} {stat.label.replace(" yds", " yd")}</div></div>;
              })}
            </div></section>
          </div>
          <div className="fan-tools-grid">
            <section className="panel fan-tool-card">
              <header className="panel-header"><div><div className="panel-title">Fan huddle</div><div className="panel-caption">Who takes the next sample AFC West matchup?</div></div><span className="panel-tag">LOCAL POLL</span></header>
              <div className="poll-options">
                {(["chargers", "chiefs"] as const).map(team => {
                  const label = team === "chargers" ? "Chargers" : "Chiefs";
                  const count = pollVotes[team];
                  const percent = team === "chargers" ? chargersPercent : chiefsPercent;
                  return <div className="poll-option" key={team}>
                    {userVote ? <><div className="poll-result-head"><span>{label}{userVote === team ? " · Your pick" : ""}</span><b>{percent}%</b></div><div className="poll-track"><span style={{ width: `${percent}%` }} /></div></> : <button className="poll-vote" onClick={() => castVote(team)}>{label}<span>Cast vote</span></button>}
                    {userVote && <span className="poll-count">{count} local {count === 1 ? "vote" : "votes"}</span>}
                  </div>;
                })}
                <p className="poll-note">Votes stay {isSignedIn ? "with your account" : "in this browser"}; this is not a shared or live poll.</p>
              </div>
            </section>
            <section className="panel fan-tool-card">
              <header className="panel-header"><div><div className="panel-title">Scout a random player</div><div className="panel-caption">Let the 2026 player pool pick your next film stop.</div></div><button className="thin-button" onClick={pickRandomPlayer}>Pick one</button></header>
              {players.find(player => player.id === randomPlayerId) ? <button className="random-player" onClick={() => openPlayer(players.find(player => player.id === randomPlayerId)!)}><span className="player-avatar">{players.find(player => player.id === randomPlayerId)?.initials}</span><span><b>{players.find(player => player.id === randomPlayerId)?.name}</b><small>{players.find(player => player.id === randomPlayerId)?.position} · {players.find(player => player.id === randomPlayerId)?.team}</small></span><Icon name="arrow" size={15} /></button> : <div className="fan-tool-empty">No pick yet. Choose a name from the current player directory.</div>}
            </section>
            <section className="panel fan-tool-card">
              <header className="panel-header"><div><div className="panel-title">Recently viewed</div><div className="panel-caption">Your last five film-room stops.</div></div><Icon name="trend" size={16} /></header>
              {recentlyViewed.length ? <div className="recent-list">{recentlyViewed.map(id => {
                const player = players.find(item => item.id === id);
                return player ? <button key={id} onClick={() => openPlayer(player)}><span>{player.name}</span><small>{player.position}</small></button> : null;
              })}</div> : <div className="fan-tool-empty">Open a player profile to build your recent list.</div>}
            </section>
          </div>
          <div className="section-head"><div><div className="eyebrow">Get into the details</div><h2>Choose your angle</h2></div></div>
          <div className="stat-strip">
            {[["Player directory", "Search the 2026 player pool by name, position, or team.", "Players", "users"], ["Build your playbook", "Save formations, concepts, and the situations they fit.", "Playbook", "book"], ["Set your lineup", "Put a custom roster board together for your league.", "Lineups", "lineup"], ["Six football lenses", "Compare tactical perspectives from a simulated panel.", "Film room", "film"]].map(([title, desc, destination, icon]) => <button className="stat-card" key={title} onClick={() => goto(destination as View)} style={{ textAlign: "left", width: "100%", border: "1px solid var(--line)" }}><div><div className="stat-label">{title}</div><div className="section-sub" style={{ maxWidth: 195, lineHeight: 1.45 }}>{desc}</div></div><div className="stat-mark"><Icon name={icon} size={16} /></div></button>)}
          </div>
        </>}

        {view === "Players" && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">The player pool</div><h2>Player directory</h2><div className="section-sub">Search and add players below, or browse 2026 position leaders above. <a href={statsSourceUrl} target="_blank" rel="noreferrer">NFL.com player stats</a></div></div><button className="primary-button" onClick={() => { if (selected.length !== 2) { setToast("Select exactly two players to compare."); return; } setComparisonOpen(true); }}>Compare selected <Icon name="compare" size={14} /> {selected.length}/2</button></div>
          <section className="leaderboard-panel" aria-labelledby="leaderboard-title">
            <div className="leaderboard-header">
              <div><div className="eyebrow">2026 season leaders</div><h3 id="leaderboard-title">Top 10 by position</h3><p>Position-specific yardage leaders from the regular season.</p></div>
              <div className="position-tabs" role="group" aria-label="Choose a player position">
                {(["QB", "RB", "WR", "TE"] as const).map(positionCode => <button key={positionCode} aria-pressed={leaderboardPosition === positionCode} className={leaderboardPosition === positionCode ? "active" : ""} onClick={() => setLeaderboardPosition(positionCode)}><b>{positionCode}</b><span>{leaderboardConfig[positionCode].label}</span></button>)}
              </div>
            </div>
            <div className="leaderboard-rows" aria-live="polite" aria-label={`${leaderboardConfig[leaderboardPosition].label} top ten`}>
              {leaderboardPlayers.map(player => {
                const stat = leaderboardStat(player);
                const onTeam = teamPlayers.includes(player.id);
                return <div className="leaderboard-row" key={player.id}>
                  <span className="leaderboard-rank">{String(player.positionRank).padStart(2, "0")}</span>
                  <button className="leaderboard-name" onClick={() => openPlayer(player)}>{player.name}<small>{player.team}</small></button>
                  <div className="leaderboard-stat"><b>{stat.value}</b><small>{stat.label}</small><SiteRatingDisplay rating={siteRatings[player.id] ?? null} position={player.position} compact /></div>
                  <button className={`team-player-button leaderboard-add ${onTeam ? "is-added" : ""}`} aria-pressed={onTeam} onClick={() => toggleTeamPlayer(player.id)}><Icon name={onTeam ? "close" : "plus"} size={12} />{onTeam ? "On your team" : "Add to team"}</button>
                </div>;
              })}
            </div>
            <div className="leaderboard-source">Ranked by {leaderboardConfig[leaderboardPosition].metric} · Stats checked {statsCheckedAt} · Snapshot does not update automatically · <a href={leaderboardConfig[leaderboardPosition].sourceUrl} target="_blank" rel="noreferrer">StatMuse source</a></div>
            <div className="rating-explanation">Site ratings compare 2026 position-specific yardage: the top fifth earns 5 stars and the bottom fifth earns 1. They are separate from your personal ratings. Players without 2026 stats are marked unrated.</div>
          </section>
          <div className="directory-toolbar-title"><div className="eyebrow">Search the player pool</div><span>{players.length} players · Add any result to your team</span></div>
          <div className="section-toolbar">
            <label className="search-box"><Icon name="search" size={15} /><input aria-label="Search players" placeholder="Search players, teams, or positions..." value={query} onChange={event => setQuery(event.target.value)} /></label>
            <div className="toolbar-filters">
              <select className="select-control" aria-label="Filter by position" value={position} onChange={event => setPosition(event.target.value)}>{["All positions", "QB", "RB", "WR", "TE"].map(value => <option key={value}>{value}</option>)}</select>
              <select className="select-control" aria-label="Filter player group" value={playerFilter} onChange={event => setPlayerFilter(event.target.value as "all" | "favorites" | "team")}><option value="all">All players</option><option value="favorites">Favorites ({favorites.length})</option><option value="team">My team ({teamPlayers.length})</option></select>
              <select className="select-control" aria-label="Sort players" value={sortBy} onChange={event => setSortBy(event.target.value)}><option value="name">Sort: name</option><option value="yards">Sort: primary yards</option><option value="touchdowns">Sort: touchdowns</option></select>
              <button className="secondary-button" onClick={downloadPlayerCsv}>Export CSV</button>
            </div>
          </div>
          {filteredPlayers.length ? <div className="player-grid">{filteredPlayers.map(player => <article className="player-card" key={player.id}>
            <div className="player-card-actions">
              <button className={`favorite-button ${favorites.includes(player.id) ? "is-favorite" : ""}`} aria-label={favorites.includes(player.id) ? `Remove ${player.name} from favorites` : `Add ${player.name} to favorites`} aria-pressed={favorites.includes(player.id)} onClick={() => toggleFavorite(player.id)}><Icon name="star" size={16} /></button>
            </div>
            <div className="player-top"><div className="player-avatar">{player.initials}</div><div><button className="player-name player-name-link" onClick={() => openPlayer(player)}>{player.name}</button><div className="player-team">{player.number === "—" ? player.team : `#${player.number} · ${player.team}`}</div></div><span className="position-tag">{player.position}</span></div>
            <div className="player-stats">{playerStatRows(player).map(stat => <div className="player-stat" key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}</div>
            <SiteRatingDisplay rating={siteRatings[player.id] ?? null} position={player.position} />
            <div className="player-rating" role="group" aria-label={`Your rating for ${player.name}`}>
              <span>Your rating</span>{[1, 2, 3, 4, 5].map(star => <button key={star} aria-label={`Rate ${player.name} ${star} out of 5`} aria-pressed={(playerRatings[player.id] || 0) === star} onClick={() => setRating(player.id, star)} className={(playerRatings[player.id] || 0) >= star ? "rated" : ""}><Icon name="star" size={13} /></button>)}
              {playerRatings[player.id] ? <b>{playerRatings[player.id]}/5</b> : <b>—</b>}
            </div>
            <div className="player-tags">
              <div className="player-tag-list">{(playerTags[player.id] || []).map(tag => <span className="user-tag" key={tag}>{tag}<button type="button" aria-label={`Remove ${tag} tag from ${player.name}`} onClick={() => { setPlayerTags(old => ({ ...old, [player.id]: (old[player.id] || []).filter(item => item !== tag) })); setToast("Player tag removed."); }}>×</button></span>)}</div>
              <div className="tag-entry"><label className="visually-hidden" htmlFor={`player-tag-${player.id}`}>Add a tag for {player.name}</label><input id={`player-tag-${player.id}`} maxLength={30} placeholder="Add player tag…" value={tagDrafts[player.id] || ""} onChange={event => setTagDrafts(old => ({ ...old, [player.id]: event.target.value }))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addPlayerTag(player.id); } }} /><button type="button" className="thin-button" onClick={() => addPlayerTag(player.id)}>Add</button></div>
            </div>
            <div className="player-bottom"><span className="demo-badge">{player.games ? `2026 · ${player.games} games` : "No 2026 stats reported"}</span><label className="compare-check"><input type="checkbox" checked={selected.includes(player.id)} onChange={() => togglePlayer(player.id)} /> Compare</label></div>
            <button className={`team-player-button ${teamPlayers.includes(player.id) ? "is-added" : ""}`} aria-pressed={teamPlayers.includes(player.id)} onClick={() => toggleTeamPlayer(player.id)}><Icon name={teamPlayers.includes(player.id) ? "close" : "plus"} size={13} />{teamPlayers.includes(player.id) ? "Remove from team" : "Add to team"}</button>
          </article>)}</div> : <div className="empty-state"><strong>{playerFilter === "team" && teamPlayers.length === 0 ? "Your team is empty" : "No players in this huddle"}</strong><p>{playerFilter === "team" && teamPlayers.length === 0 ? "Search the player directory and add players to build your roster." : "Try a different name or position filter."}</p><button className="secondary-button" onClick={() => { setQuery(""); setPosition("All positions"); setPlayerFilter("all"); }}>{playerFilter === "team" && teamPlayers.length === 0 ? "Browse all players" : "Clear filters"}</button></div>}
          <p className="demo-badge" style={{ marginTop: 13 }}>Directory profiles use NFL.com stats; position rankings use StatMuse 2026 leader data. Both are snapshots checked {statsCheckedAt}, not live feeds. <a href={statsSourceUrl} target="_blank" rel="noreferrer">NFL.com stats</a> · <a href={leaderboardConfig[leaderboardPosition].sourceUrl} target="_blank" rel="noreferrer">Selected leaderboard source</a>.</p>
        </section>}

        {view === "Matchup lab" && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">Head-to-head breakdown</div><h2>Matchup lab</h2><div className="section-sub">Select two players in the directory or compare the default 2026 season snapshot.</div></div><button className="secondary-button" onClick={() => goto("Players")}>Browse players <Icon name="arrow" size={13} /></button></div>
          <div className="notice">Player statistics are 2026 regular-season snapshots checked {statsCheckedAt}; NFL.com supplies directory profiles and StatMuse supplies position-ranked entries. Neither updates live. Scouting notes and the analyst panel are illustrative.</div>
          <div className="comparison">{(comparePlayers.length === 2 ? comparePlayers : [players[0], players[1]]).map((player, index) => <div className="comparison-side" key={player.id}><div className="comparison-head"><small>{index === 0 ? "OFFENSE / 01" : "OFFENSE / 02"} · {player.position}</small><h3>{player.name}</h3></div><div className="compare-line"><span>Team / status</span><b>{player.team}</b></div><div className="compare-line"><span>Games played</span><b>{player.games}</b></div>{playerStatRows(player).map(stat => <div className="compare-line" key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}<div className="compare-line"><span>Film cue</span><b style={{ fontFamily: "var(--font-body)", fontSize: 10, textAlign: "right", maxWidth: "62%" }}>{player.note}</b></div><a href={player.statsUrl} target="_blank" rel="noreferrer" className="section-sub">Official NFL.com player page</a></div>)}</div>
          <PlayerComparisonCharts players={chartPlayers} />
          <div className="section-head"><div><div className="eyebrow">Six ways to see it</div><h2>Simulated analyst panel</h2></div><span className="panel-tag">DEMO ANALYSIS</span></div>
          <div className="analysis-grid">{experts.map((expert, index) => <article className="analyst-card" key={expert.name}><div className="analyst-top"><span className="analyst-number">0{index + 1}</span><div><div className="analyst-name">{expert.name}</div><div className="analyst-role">{expert.role}</div></div></div><p>{expert.text}</p><div className="analyst-pick">Key read <b>{expert.pick}</b></div></article>)}</div>
        </section>}

        {(view === "Playbook" || view === "Lineups") && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">{isSignedIn ? "Your account workspace" : "Your local workspace"}</div><h2>{view === "Playbook" ? "Custom playbook" : "Lineup manager"}</h2><div className="section-sub">{view === "Playbook" ? "Capture concepts, formations, and the situations they answer." : "Keep a custom lineup board for your fantasy decisions."} {isSignedIn ? "Synced to your account." : "Saved in this browser only."}</div></div><div className="section-actions"><button className="secondary-button" onClick={() => downloadCsv(view === "Playbook" ? "plays" : "lineups")}>Export CSV</button><button className="primary-button" onClick={() => openEditor(view === "Playbook" ? "play" : "lineup")}><Icon name="plus" size={15} /> {view === "Playbook" ? "Add a play" : "Create lineup"}</button></div></div>
          {view === "Playbook" ? <>
            <div className="section-toolbar"><span className="section-sub">{plays.length} saved concepts</span><label className="tag-filter">Filter by tag <select className="select-control" aria-label="Filter plays by tag" value={playTagFilter} onChange={event => setPlayTagFilter(event.target.value)}><option>All tags</option>{playTags.map(tag => <option key={tag}>{tag}</option>)}</select></label></div>
            <div className="panel table-panel"><table className="data-table"><thead><tr><th>Concept / play name</th><th>Formation</th><th>Personnel</th><th>Situation &amp; tags</th><th>Actions</th></tr></thead><tbody>{filteredPlays.map(play => <tr key={play.id}><td><strong>{play.name}</strong><div className="section-sub">{play.note || play.concept}</div></td><td>{play.formation}</td><td><span className="tag">{play.personnel}</span></td><td><span className="tag gold">{play.situation}</span><div className="play-tags">{(play.tags || []).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div></td><td><div className="table-actions"><button className="icon-button" aria-label={`Edit ${play.name}`} onClick={() => openEditor("play", play)}><Icon name="edit" size={14} /></button><button className="icon-button" aria-label={`Delete ${play.name}`} onClick={() => removeItem("play", play.id)}><Icon name="trash" size={14} /></button></div></td></tr>)}</tbody></table>{filteredPlays.length === 0 && plays.length > 0 && <div className="empty-state"><strong>No plays match this tag</strong><p>Try another tag or add a concept to your call sheet.</p><button className="secondary-button" onClick={() => setPlayTagFilter("All tags")}>Show all plays</button></div>}{plays.length === 0 && <div className="empty-state"><strong>Your playbook is open</strong><p>Add a concept to start building your call sheet.</p><button className="primary-button" onClick={() => openEditor("play")}><Icon name="plus" size={14} /> Add your first play</button></div>}</div>
          </> :
            <div className="player-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(265px,1fr))" }}>{lineups.map(lineup => <article className="player-card" key={lineup.id}><div className="player-top"><div className="player-avatar"><Icon name="lineup" size={20} /></div><div><div className="player-name">{lineup.name}</div><div className="player-team">{lineup.format}</div></div></div><div className="player-stats" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>{[["QB", lineup.quarterback], ["RB", lineup.runningBack], ["WR", lineup.receiver], ["TE", lineup.tightEnd]].map(([pos, name]) => <div className="player-stat" key={pos}><span>{pos}</span><b style={{ font: "600 11px var(--font-body)", lineHeight: 1.25, marginTop: 6 }}>{name}</b></div>)}</div><div className="player-bottom"><span className="demo-badge">{lineup.note || "Custom lineup"}</span><div className="table-actions"><button className="icon-button" aria-label={`Edit ${lineup.name}`} onClick={() => openEditor("lineup", lineup)}><Icon name="edit" size={14} /></button><button className="icon-button" aria-label={`Delete ${lineup.name}`} onClick={() => removeItem("lineup", lineup.id)}><Icon name="trash" size={14} /></button></div></div></article>)}
              {!lineups.length && <div className="empty-state"><strong>Empty lineup board</strong><p>Build your first roster snapshot. {isSignedIn ? "It will be saved to your account." : "It stays on this device."}</p><button className="primary-button" onClick={() => openEditor("lineup")}><Icon name="plus" size={14} /> Create lineup</button></div>}</div>}
        </section>}

        {view === "Film room" && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">The tape never lies</div><h2>Film room</h2><div className="section-sub">Six distinct simulated football lenses. For conversation and learning—not real expert commentary.</div></div><span className="panel-tag">SIMULATED / DEMO</span></div>
          <div className="notice">These are generated example perspectives, not quotes or analysis from actual NFL experts. No live game footage, data, or expert service is connected.</div>
          <div className="analysis-grid">{experts.map((expert, index) => <article className="analyst-card" key={expert.name}><div className="analyst-top"><span className="analyst-number">0{index + 1}</span><div><div className="analyst-name">{expert.name}</div><div className="analyst-role">{expert.role}</div></div></div><p>{expert.text}</p><div className="analyst-pick">Angle to watch <b>{expert.pick}</b></div></article>)}</div>
          <section className="panel prompt-card" style={{ marginTop: 14 }}><header className="panel-header"><div><div className="panel-title">One question for the tape</div><div className="panel-caption">A random prompt to guide your next watch-through.</div></div><button className="thin-button" onClick={newFilmPrompt}>New prompt</button></header><div className="film-prompt">{filmPrompt}</div></section>
        </section>}
      </div>
    </main>

    {playerDetail && <Modal title={playerDetail.name} subtitle={`${playerDetail.position} · #${playerDetail.number} · ${playerDetail.team}`} onClose={() => setPlayerDetail(null)} footer={<><button className="secondary-button" onClick={() => { toggleFavorite(playerDetail.id); }}>{favorites.includes(playerDetail.id) ? "Remove favorite" : "Save favorite"}</button><button className="secondary-button" aria-pressed={teamPlayers.includes(playerDetail.id)} onClick={() => toggleTeamPlayer(playerDetail.id)}>{teamPlayers.includes(playerDetail.id) ? "Remove from team" : "Add to team"}</button><button className="primary-button" onClick={() => { togglePlayer(playerDetail.id); setPlayerDetail(null); }}>Select for comparison</button></>}>
      <div className="notice">{playerDetail.positionRank ? `2026 position-ranking snapshot from StatMuse, checked ${statsCheckedAt}. Rankings do not update automatically.` : `2026 regular-season stats from NFL.com, checked ${statsCheckedAt}. This saved snapshot does not update automatically. A player with no line is shown without invented zero statistics.`}</div>
      <div className="detail-profile"><div className="player-avatar">{playerDetail.initials}</div><div><div className="detail-grade">2026 regular season <b>{playerDetail.games ? `${playerDetail.games} games` : "No stats"}</b></div><div className="section-sub">{primaryStat(playerDetail).label}: {primaryStat(playerDetail).value}</div></div></div>
      <div className="player-stats">{playerStatRows(playerDetail).map(stat => <div className="player-stat" key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}</div>
      <SiteRatingDisplay rating={siteRatings[playerDetail.id] ?? null} position={playerDetail.position} />
      <a href={playerDetail.statsUrl} target="_blank" rel="noreferrer" className="section-sub">{playerDetail.positionRank ? "Open the position ranking source" : `View ${playerDetail.name}'s NFL.com stats`}</a>
      <div className="detail-note"><div className="eyebrow">{playerDetail.positionRank ? "2026 position rank" : "Illustrative film cue"}</div><p>{playerDetail.positionRank ? `#${playerDetail.positionRank} by ${leaderboardConfig[playerDetail.position as LeaderboardPosition].metric}.` : playerDetail.note}</p></div>
      <div className="player-rating detail-rating" role="group" aria-label={`Your rating for ${playerDetail.name}`}><span>Your rating</span>{[1, 2, 3, 4, 5].map(star => <button key={star} aria-label={`Rate ${playerDetail.name} ${star} out of 5`} aria-pressed={(playerRatings[playerDetail.id] || 0) === star} onClick={() => setRating(playerDetail.id, star)} className={(playerRatings[playerDetail.id] || 0) >= star ? "rated" : ""}><Icon name="star" size={14} /></button>)}<b>{playerRatings[playerDetail.id] ? `${playerRatings[playerDetail.id]}/5` : "Not rated"}</b></div>
    </Modal>}

    {modal && <Modal title={isEditing ? `Edit ${resource}` : `Add ${resource}`} subtitle={isSignedIn ? "Your changes sync to your account." : "Guest changes are saved on this device."} onClose={() => setModal(null)} footer={<><button className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" type="submit" form="resource-form">{isEditing ? "Save changes" : "Create entry"}</button></>}>
      <form id="resource-form" onSubmit={saveItem}><div className="form-grid">
        <div className="field full"><label htmlFor="resource-name">{resource === "play" ? "Play / concept name" : "Lineup name"}</label><input id="resource-name" value={editName} onChange={event => setEditName(event.target.value)} placeholder={resource === "play" ? "e.g. Boundary read" : "e.g. Week 4 core"} autoFocus /></div>
        {resource === "play" ? <>
          <div className="field"><label htmlFor="formation">Formation</label><input id="formation" value={formValues.formation || ""} onChange={event => setFormValues({ ...formValues, formation: event.target.value })} placeholder="Gun Trips Right" /></div>
          <div className="field"><label htmlFor="personnel">Personnel</label><input id="personnel" value={formValues.personnel || ""} onChange={event => setFormValues({ ...formValues, personnel: event.target.value })} placeholder="11 personnel" /></div>
          <div className="field"><label htmlFor="concept">Core concept</label><input id="concept" value={formValues.concept || ""} onChange={event => setFormValues({ ...formValues, concept: event.target.value })} placeholder="Levels / spacing" /></div>
          <div className="field"><label htmlFor="situation">Situation</label><input id="situation" value={formValues.situation || ""} onChange={event => setFormValues({ ...formValues, situation: event.target.value })} placeholder="3rd & short" /></div>
          <div className="field full"><label htmlFor="tags">Tags</label><input id="tags" value={formValues.tags || ""} onChange={event => setFormValues({ ...formValues, tags: event.target.value })} placeholder="e.g. quick game, coverage read" /><span className="field-hint">Separate tags with commas to filter your playbook later.</span></div>
        </> : <>
          <div className="field"><label htmlFor="format">League / format</label><input id="format" value={formValues.format || ""} onChange={event => setFormValues({ ...formValues, format: event.target.value })} placeholder="Fantasy · PPR" /></div>
          <div className="field"><label htmlFor="qb">Quarterback</label><input id="qb" value={formValues.quarterback || ""} onChange={event => setFormValues({ ...formValues, quarterback: event.target.value })} placeholder="Player name" /></div>
          <div className="field"><label htmlFor="rb">Running back</label><input id="rb" value={formValues.runningBack || ""} onChange={event => setFormValues({ ...formValues, runningBack: event.target.value })} placeholder="Player name" /></div>
          <div className="field"><label htmlFor="wr">Wide receiver</label><input id="wr" value={formValues.receiver || ""} onChange={event => setFormValues({ ...formValues, receiver: event.target.value })} placeholder="Player name" /></div>
          <div className="field"><label htmlFor="te">Tight end</label><input id="te" value={formValues.tightEnd || ""} onChange={event => setFormValues({ ...formValues, tightEnd: event.target.value })} placeholder="Player name" /></div>
        </>}
        <div className="field full"><label htmlFor="note">{resource === "play" ? "Coaching note" : "Lineup note"}</label><textarea id="note" value={formValues.note || ""} onChange={event => setFormValues({ ...formValues, note: event.target.value })} placeholder={resource === "play" ? "What is the read? What should the defense show?" : "Why does this lineup fit the matchup?"} /></div>
      </div>{formError && <p role="alert" style={{ color: "#ae4853", fontSize: 11, margin: "10px 0 0" }}>{formError}</p>}</form>
    </Modal>}
    {comparisonOpen && <Modal title="Head-to-head" subtitle="2026 regular-season snapshot." onClose={() => setComparisonOpen(false)}><div className="notice">Stats checked {statsCheckedAt}; this is not a live feed. Film cues are illustrative.</div><div className="comparison">{(comparePlayers.length === 2 ? comparePlayers : [players[0], players[1]]).map((player, index) => <div className="comparison-side" key={player.id}><div className="comparison-head"><small>{index === 0 ? "PLAYER 01" : "PLAYER 02"} · {player.position}</small><h3>{player.name}</h3></div><div className="compare-line"><span>Team / status</span><b>{player.team}</b></div><div className="compare-line"><span>Games played</span><b>{player.games}</b></div>{playerStatRows(player).map(stat => <div className="compare-line" key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}<a href={player.statsUrl} target="_blank" rel="noreferrer" className="section-sub">{player.positionRank ? "StatMuse ranking source" : "NFL.com stats"}</a></div>)}</div><div className="dialog-footer" style={{ padding: "16px 0 0" }}><button className="primary-button" onClick={() => { setComparisonOpen(false); goto("Matchup lab"); }}>Open tactical panel <Icon name="arrow" size={13} /></button></div></Modal>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
