"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlayerProfile } from "@/lib/player-directory";
import type { SavedBotGame } from "@/lib/progress";
import type { PublicGame } from "@/lib/game-server";

type Props = {
  players: PlayerProfile[];
  botGames: SavedBotGame[];
  isSignedIn: boolean;
  onPlayGame: () => void;
};

type HistoryRow = {
  id: string;
  kind: "bot" | "online";
  createdAt: string;
  yourRoster: string[];
  opponentRoster: string[];
  yourScore: number;
  opponentScore: number;
  history: SavedBotGame["history"];
};

async function loadOnlineGames(): Promise<PublicGame[]> {
  const response = await fetch("/api/games/history", { cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "Online game history could not be loaded.");
  }
  return Array.isArray(result.games) ? result.games as PublicGame[] : [];
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getResult(yourScore: number, opponentScore: number) {
  if (yourScore === opponentScore) return { label: "TIE", className: "is-tie" };
  return yourScore > opponentScore
    ? { label: "WIN", className: "is-win" }
    : { label: "LOSS", className: "is-loss" };
}

export default function GameHistory({ players, botGames, isSignedIn, onPlayGame }: Props) {
  const [onlineGames, setOnlineGames] = useState<PublicGame[]>([]);
  const [loading, setLoading] = useState(isSignedIn);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError("");
    try {
      setOnlineGames(await loadOnlineGames());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Game history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) void refresh();
  }, [isSignedIn, refresh]);

  const historyRows = useMemo<HistoryRow[]>(() => {
    const bots: HistoryRow[] = botGames.map(game => ({
      id: `bot-${game.id}`,
      kind: "bot",
      createdAt: game.createdAt,
      yourRoster: game.homeRoster,
      opponentRoster: game.awayRoster,
      yourScore: game.homeScore,
      opponentScore: game.awayScore,
      history: game.history
    }));
    const online: HistoryRow[] = onlineGames.flatMap(game => {
      if (!game.state || !game.awayRoster) return [];
      const isHome = game.mySide === "home";
      return [{
        id: `online-${game.id}`,
        kind: "online",
        createdAt: game.createdAt,
        yourRoster: isHome ? game.homeRoster : game.awayRoster,
        opponentRoster: isHome ? game.awayRoster : game.homeRoster,
        yourScore: isHome ? game.state.homeScore : game.state.awayScore,
        opponentScore: isHome ? game.state.awayScore : game.state.homeScore,
        history: game.state.history
      }];
    });
    return [...bots, ...online].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [botGames, onlineGames]);

  const playerNames = (ids: string[]) => ids
    .map(id => players.find(player => player.id === id)?.name || "Player")
    .join(" · ");

  return <section className="section-layout game-history-view">
    <div className="section-head game-history-heading">
      <div>
        <div className="eyebrow">Your completed matches</div>
        <h2>Game history</h2>
        <div className="section-sub">Final scores and scoring plays from games you have finished.</div>
      </div>
      <div className="game-history-actions">
        {isSignedIn && <button className="secondary-button" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh history"}</button>}
        <button className="primary-button" onClick={onPlayGame}>Play a game <span aria-hidden="true">→</span></button>
      </div>
    </div>

    {!isSignedIn && <p className="game-history-note">Bot games are saved in this browser. Sign in to keep them with your account and see completed online matches.</p>}
    {error && <div className="game-error" role="alert">{error}</div>}
    {loading && !historyRows.length && <div className="game-history-loading"><span className="sync-spinner" /> Loading your games…</div>}

    {historyRows.length > 0
      ? <div className="game-history-list">
        {historyRows.map(game => {
          const result = getResult(game.yourScore, game.opponentScore);
          const scoringPlays = game.history.filter(play => play.points > 0);
          return <article className="game-history-card" key={game.id}>
            <header className="game-history-card-head">
              <div><span className="game-history-kind">{game.kind === "bot" ? "BOT MATCH" : "ONLINE MATCH"}</span><time dateTime={game.createdAt}>{formatDate(game.createdAt)}</time></div>
              <span className={`game-history-result ${result.className}`}>{result.label}</span>
            </header>
            <div className="game-history-scoreline">
              <div className="game-history-team is-you"><span>Your team</span><b>{game.yourScore}</b><small>{playerNames(game.yourRoster)}</small></div>
              <span className="game-history-vs">FINAL</span>
              <div className="game-history-team"><span>{game.kind === "bot" ? "All-Pro bot" : "Opponent"}</span><b>{game.opponentScore}</b><small>{playerNames(game.opponentRoster)}</small></div>
            </div>
            <footer className="game-history-card-foot">
              <span>{game.history.length} plays</span>
              {scoringPlays.length
                ? <div className="game-history-scoring">{scoringPlays.map((play, index) => <span key={`${game.id}-score-${index}`}>{play.points === 7 ? "TD" : "FG"} +{play.points}</span>)}</div>
                : <span>No scores</span>}
            </footer>
          </article>;
        })}
      </div>
      : !loading && !error && <div className="game-history-empty">
        <span className="game-history-empty-icon" aria-hidden="true">↻</span>
        <h3>No completed games yet</h3>
        <p>Finished bot and online matches will show up here with their scores and scoring plays.</p>
        <button className="primary-button" onClick={onPlayGame}>Start your first game <span aria-hidden="true">→</span></button>
      </div>}
  </section>;
}
