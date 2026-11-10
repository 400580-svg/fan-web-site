"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  averageRosterRating,
  counterDefense,
  counterOffense,
  createGameState,
  drivesPerGame,
  playsPerDrive,
  getRecommendedRoster,
  resolvePlay,
  rosterSlots,
  validateGameRoster,
  type DefensiveCall,
  type GameCall,
  type GameState,
  type OffensiveCall
} from "@/lib/game-engine";
import { calculate2026SiteRatings } from "@/lib/player-ratings";
import type { PlayerProfile } from "@/lib/player-directory";
import type { OpenGame, PublicGame } from "@/lib/game-server";
import DriveSimulation from "./DriveSimulation";

type Props = {
  players: PlayerProfile[];
  teamPlayers: string[];
  isSignedIn: boolean;
};

const slotLabels = ["Quarterback", "Running back", "Wide receiver 1", "Wide receiver 2", "Tight end"];
const offenseOptions: { value: OffensiveCall; label: string; detail: string }[] = [
  { value: "run", label: "Inside run", detail: "Steady ground game; counter the blitz." },
  { value: "quick_pass", label: "Quick pass", detail: "Fast timing route; punish soft coverage." },
  { value: "deep_pass", label: "Deep shot", detail: "Big-play chance; attack the secondary." }
];
const defenseOptions: { value: DefensiveCall; label: string; detail: string }[] = [
  { value: "stack_box", label: "Stack the box", detail: "Crowd the line and make them throw." },
  { value: "zone", label: "Zone coverage", detail: "Protect the deep field and rally to the ball." },
  { value: "blitz", label: "Bring pressure", detail: "Disrupt timing and force a quick decision." }
];
const allOffensiveCalls: OffensiveCall[] = offenseOptions.map(option => option.value);
const allDefensiveCalls: DefensiveCall[] = defenseOptions.map(option => option.value);

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      ...(options?.body ? { "content-type": "application/json" } : {}),
      ...options?.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "The game request could not be completed.");
  return data as T;
}

function scoreLabel(home: number, away: number, mySide: "home" | "away") {
  const mine = mySide === "home" ? home : away;
  const theirs = mySide === "home" ? away : home;
  if (mine === theirs) return "The game ends in a tie.";
  return mine > theirs ? "You win the game." : "Your opponent wins.";
}

export default function PlayCallingGame({ players, teamPlayers, isSignedIn }: Props) {
  const [mode, setMode] = useState<"bot" | "online">("bot");
  const [rosterIds, setRosterIds] = useState(() => getRecommendedRoster(players, teamPlayers));
  const [botGame, setBotGame] = useState<GameState | null>(null);
  const [onlineGame, setOnlineGame] = useState<PublicGame | null>(null);
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settledPlayKey, setSettledPlayKey] = useState("");
  const siteRatings = useMemo(() => calculate2026SiteRatings(players), [players]);
  const rosterError = validateGameRoster(rosterIds, players);

  const refreshOnline = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const data = await apiRequest<{ openGames: OpenGame[]; myGame: PublicGame | null }>("/api/games");
      setOpenGames(data.openGames);
      if (data.myGame) setOnlineGame(data.myGame);
      else setOnlineGame(current => current?.status === "complete" ? current : null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Online games could not be loaded.");
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (mode !== "online" || !isSignedIn) return;
    void refreshOnline();
    const timer = window.setInterval(() => void refreshOnline(), 3000);
    return () => window.clearInterval(timer);
  }, [mode, isSignedIn, refreshOnline]);

  const startBotGame = () => {
    if (rosterError) {
      setError(rosterError);
      return;
    }
    const botRoster = getRecommendedRoster(players, [], rosterIds);
    setBotGame(createGameState(rosterIds, botRoster));
    setOnlineGame(null);
    setError("");
    setMessage("Your team is on offense to start.");
  };

  const callBotPlay = (call: GameCall) => {
    if (!botGame || botGame.drivesCompleted >= drivesPerGame) return;
    const userIsOffense = botGame.currentOffense === "home";
    const offenseCall = userIsOffense
      ? call as OffensiveCall
      : Math.random() < 0.65
        ? counterOffense(call as DefensiveCall)
        : allOffensiveCalls[Math.floor(Math.random() * allOffensiveCalls.length)];
    const defenseCall = userIsOffense
      ? Math.random() < 0.65
        ? counterDefense(call as OffensiveCall)
        : allDefensiveCalls[Math.floor(Math.random() * allDefensiveCalls.length)]
      : call as DefensiveCall;
    setBotGame(current => current ? resolvePlay(current, players, offenseCall, defenseCall) : current);
    setError("");
  };

  const createOnlineGame = async () => {
    if (rosterError) {
      setError(rosterError);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await apiRequest<{ game: PublicGame }>("/api/games", {
        method: "POST",
        body: JSON.stringify({ roster: rosterIds })
      });
      setOnlineGame(data.game);
      setBotGame(null);
      setMessage("Your open match is listed for other signed-in fans.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create an open match.");
    } finally {
      setBusy(false);
    }
  };

  const joinOnlineGame = async (gameId: string) => {
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<{ game: PublicGame }>(`/api/games/${gameId}`, {
        method: "POST",
        body: JSON.stringify({ action: "join", roster: rosterIds })
      });
      setOnlineGame(data.game);
      setBotGame(null);
      setMessage("Match found. You are playing the away side.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not join that game.");
      void refreshOnline();
    } finally {
      setBusy(false);
    }
  };

  const cancelOnlineGame = async () => {
    if (!onlineGame) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ game: PublicGame }>(`/api/games/${onlineGame.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "cancel" })
      });
      setOnlineGame(null);
      setMessage("Your open game has been cancelled.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not cancel the open game.");
    } finally {
      setBusy(false);
    }
  };

  const leaveOnlineGame = async () => {
    if (!onlineGame) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ game: PublicGame }>(`/api/games/${onlineGame.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "leave" })
      });
      setOnlineGame(null);
      setMessage("You left the match. No final result was recorded.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not leave the match.");
    } finally {
      setBusy(false);
    }
  };

  const submitOnlineCall = async (call: GameCall) => {
    if (!onlineGame) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<{ game: PublicGame }>(`/api/games/${onlineGame.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "call", call, play: onlineGame.state?.history.length })
      });
      setOnlineGame(data.game);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your call could not be saved.");
      void refreshOnline();
    } finally {
      setBusy(false);
    }
  };

  const changeRosterSlot = (slotIndex: number, playerId: string) => {
    setRosterIds(current => current.map((id, index) => index === slotIndex ? playerId : id));
    setError("");
  };

  const currentState = mode === "bot" ? botGame : onlineGame?.state || null;
  const currentPlayKey = currentState?.lastDrive
    ? `${mode}-${mode === "online" ? onlineGame?.id || "match" : "bot"}-${currentState.history.length}-${currentState.lastDrive.offense}-${currentState.lastDrive.offenseCall}-${currentState.lastDrive.defenseCall}-${currentState.lastDrive.yards}`
    : "";
  const isSimulating = Boolean(currentPlayKey && currentPlayKey !== settledPlayKey);
  useEffect(() => {
    if (!currentPlayKey) {
      setSettledPlayKey("");
      return;
    }
    const playKey = currentPlayKey;
    const timer = window.setTimeout(() => setSettledPlayKey(playKey), 1800);
    return () => window.clearTimeout(timer);
  }, [currentPlayKey]);
  const currentStatus = mode === "bot"
    ? botGame && botGame.drivesCompleted >= drivesPerGame ? "complete" : botGame ? "active" : "none"
    : onlineGame?.status || "none";
  const mySide = mode === "bot" ? "home" : onlineGame?.mySide || "home";
  const role = mode === "bot"
    ? currentState ? currentState.currentOffense === "home" ? "offense" : "defense" : null
    : onlineGame?.myRole || null;
  const teamLabel = (side: "home" | "away") => mode === "bot"
    ? side === "home" ? "Your team" : "All-Pro bot"
    : side === mySide ? "Your team" : "Opponent";
  const homeRoster = currentState?.homeRoster || onlineGame?.homeRoster || [];
  const awayRoster = currentState?.awayRoster.length ? currentState.awayRoster : onlineGame?.awayRoster || [];
  const winnerText = currentState && currentStatus === "complete"
    ? scoreLabel(currentState.homeScore, currentState.awayScore, mySide)
    : "";

  const renderRosterNames = (ids: string[]) => ids.map(id => players.find(player => player.id === id)?.name || "Player").join(" · ");
  const renderScoreboard = (state: GameState | Omit<GameState, "pending">) => (
    <div className="game-scoreboard">
      <div className={`game-score-side ${mySide === "home" ? "is-you" : ""}`}><span>{teamLabel("home")}</span><strong>{state.homeScore}</strong><small>{renderRosterNames(state.homeRoster)}</small></div>
      <div className="game-score-center"><span>POSSESSION</span><b>{Math.min(isSimulating && state.lastDrive?.possessionEnded ? state.lastDrive.driveNumber : state.drivesCompleted + 1, drivesPerGame)}<i> / {drivesPerGame}</i></b><small>{state.drivesCompleted >= drivesPerGame ? "FINAL" : `PLAY ${Math.min(isSimulating && state.lastDrive ? state.lastDrive.playNumber : state.playsInDrive + 1, playsPerDrive)} / ${playsPerDrive}`}</small></div>
      <div className={`game-score-side ${mySide === "away" ? "is-you" : ""}`}><span>{teamLabel("away")}</span><strong>{state.awayScore}</strong><small>{renderRosterNames(state.awayRoster)}</small></div>
    </div>
  );

  return <section className="section-layout game-center">
    <div className="section-head game-heading">
      <div><div className="eyebrow">Turn-based football</div><h2>Game day</h2><div className="section-sub">Pick five 2026 players, call the offense or defense, and compete for the final score.</div></div>
      <span className="panel-tag"><span className="game-live-dot" /> SIX-POSSESSION MATCH</span>
    </div>

    <div className="game-mode-switch" role="tablist" aria-label="Choose an opponent">
      <button role="tab" aria-selected={mode === "bot"} className={mode === "bot" ? "active" : ""} onClick={() => { setMode("bot"); setError(""); }}>Play the bot <small>Instant game</small></button>
      <button role="tab" aria-selected={mode === "online"} className={mode === "online" ? "active" : ""} onClick={() => { setMode("online"); setError(""); }}>Play online <small>Match with a fan</small></button>
    </div>

    {currentStatus === "none" && <section className="game-roster-panel">
      <div className="game-panel-heading"><div><div className="eyebrow">Build your offense</div><h3>Choose your five starters</h3><p>One quarterback, one running back, two wide receivers, and one tight end.</p></div><span className="game-roster-rating">{averageRosterRating(rosterIds, players).toFixed(1)}<small> / 5 team stars</small></span></div>
      <div className="game-roster-slots">
        {rosterSlots.map((position, index) => {
          const currentId = rosterIds[index] || "";
          const selectedIds = new Set(rosterIds.filter((_, slot) => slot !== index));
          const options = players
            .filter(player => player.position === position && siteRatings[player.id] !== null && (!selectedIds.has(player.id) || player.id === currentId))
            .sort((a, b) => (siteRatings[b.id] || 0) - (siteRatings[a.id] || 0) || a.name.localeCompare(b.name));
          return <label className="game-roster-slot" key={`${position}-${index}`}>
            <span><b>{position}</b>{slotLabels[index]}</span>
            <select value={currentId} onChange={event => changeRosterSlot(index, event.target.value)} aria-label={`Choose ${slotLabels[index]}`}>
              {options.map(player => <option key={player.id} value={player.id}>{player.name} · {player.team}</option>)}
            </select>
            <small>{currentId ? `${players.find(player => player.id === currentId)?.games || 0} 2026 games · ${siteRatings[currentId] || 0} stars` : "Choose a player"}</small>
          </label>;
        })}
      </div>
      <div className="game-roster-actions">
        {teamPlayers.length > 0 && <button className="text-button" onClick={() => setRosterIds(getRecommendedRoster(players, teamPlayers))}>Use my saved team picks</button>}
        <div className="section-sub">{rosterError || "Only players with verified 2026 statistics are eligible."}</div>
      </div>
      {mode === "bot"
        ? <button className="primary-button game-start-button" disabled={Boolean(rosterError)} onClick={startBotGame}>Start game vs bot <span>→</span></button>
        : isSignedIn
          ? <button className="primary-button game-start-button" disabled={Boolean(rosterError) || busy} onClick={() => void createOnlineGame()}>{busy ? "Opening match…" : "Create an open match"} <span>→</span></button>
          : <div className="game-signin-note">Sign in to play another fan. <Link href="/sign-in">Sign in</Link> or <Link href="/sign-up">create an account</Link>.</div>}
    </section>}

    {mode === "bot" && currentStatus !== "none" && currentState && <section className="game-match-panel">
      {renderScoreboard(currentState)}
      <DriveSimulation state={currentState} players={players} isAnimating={isSimulating} />
      {currentStatus === "complete"
        ? <div className="game-result"><div className="eyebrow">Final score</div><h3>{winnerText}</h3><p>{currentState.homeScore}–{currentState.awayScore} after {drivesPerGame} possessions.</p><button className="primary-button" onClick={() => { setBotGame(null); setError(""); }}>Start another game</button></div>
        : <div className="game-call-area">
          <div className="game-call-title"><span className="game-turn-kicker">POSSESSION {isSimulating && currentState.lastDrive ? currentState.lastDrive.driveNumber : currentState.drivesCompleted + 1} · PLAY {isSimulating && currentState.lastDrive ? currentState.lastDrive.playNumber : currentState.playsInDrive + 1} OF {playsPerDrive}</span><h3>{isSimulating ? "Watch the play unfold." : role === "offense" ? "Your team has the ball." : "You’re setting the defense."}</h3><p>{isSimulating ? "The ball is live. The result will appear in the play log." : role === "offense" ? "Choose a play to score. You have six plays before a turnover on downs." : "Choose a defensive call to stop the offense before it scores."}</p></div>
          <div className="game-call-grid">
            {(role === "offense" ? offenseOptions : defenseOptions).map(option => <button className="game-call-card" key={option.value} disabled={isSimulating} onClick={() => callBotPlay(option.value)}><span className="game-call-icon"><i /></span><b>{option.label}</b><small>{option.detail}</small><span className="game-call-arrow">CALL PLAY →</span></button>)}
          </div>
        </div>}
      <DriveFeed history={currentState.history} players={players} teamLabel={teamLabel} />
    </section>}

    {mode === "online" && !isSignedIn && <section className="game-empty-online"><span className="game-empty-icon">↗</span><h3>Play a real opponent</h3><p>Online matches use your account to keep rosters, turns, and scores attached to the right players.</p><div><Link href="/sign-in" className="primary-button">Sign in</Link><Link href="/sign-up" className="secondary-button">Create account</Link></div></section>}

    {mode === "online" && isSignedIn && onlineGame && <section className="game-match-panel">
      {onlineGame.status === "waiting"
        ? <div className="game-waiting"><div className="game-waiting-icon"><i /></div><div><div className="eyebrow">Open challenge</div><h3>Waiting for another fan</h3><p>Your five-player lineup is saved. Signed-in players can join from the open matches list.</p><div className="game-waiting-lineup">{renderRosterNames(onlineGame.homeRoster)}</div></div><button className="secondary-button" disabled={busy} onClick={() => void cancelOnlineGame()}>Cancel match</button></div>
        : onlineGame.state && <>
          {renderScoreboard(onlineGame.state)}
          <DriveSimulation state={onlineGame.state} players={players} isAnimating={isSimulating} />
          {onlineGame.status === "complete"
            ? <div className="game-result"><div className="eyebrow">Final score</div><h3>{winnerText}</h3><p>{onlineGame.state.homeScore}–{onlineGame.state.awayScore} after {drivesPerGame} possessions.</p><button className="primary-button" onClick={() => { setOnlineGame(null); setMessage(""); }}>Find another match</button></div>
            : <div className="game-call-area">
              <div className="game-call-title"><span className="game-turn-kicker">POSSESSION {isSimulating && onlineGame.state.lastDrive ? onlineGame.state.lastDrive.driveNumber : onlineGame.state.drivesCompleted + 1} · PLAY {isSimulating && onlineGame.state.lastDrive ? onlineGame.state.lastDrive.playNumber : onlineGame.state.playsInDrive + 1} OF {playsPerDrive} · {onlineGame.myRole?.toUpperCase()}</span><h3>{isSimulating ? "Watch the play unfold." : onlineGame.myMoveSubmitted ? "Your call is locked in." : onlineGame.myRole === "offense" ? "Your team has the ball." : "You’re setting the defense."}</h3><p>{isSimulating ? "The ball is live. The result will appear in the play log." : onlineGame.myMoveSubmitted ? "Waiting for the other player to make their call." : onlineGame.myRole === "offense" ? "Choose a play to score. You have six plays before a turnover on downs." : "Choose a defensive call to stop the offense before it scores."}</p></div>
              {onlineGame.myMoveSubmitted
                ? <div className="game-waiting-opponent"><span className="game-live-dot" /> Waiting for opponent’s call…</div>
                : <div className="game-call-grid">{(onlineGame.myRole === "offense" ? offenseOptions : defenseOptions).map(option => <button className="game-call-card" key={option.value} disabled={busy || isSimulating} onClick={() => void submitOnlineCall(option.value)}><span className="game-call-icon"><i /></span><b>{option.label}</b><small>{option.detail}</small><span className="game-call-arrow">CALL PLAY →</span></button>)}</div>}
              <button className="game-leave-button" disabled={busy} onClick={() => void leaveOnlineGame()}>Leave this match</button>
            </div>}
          <DriveFeed history={onlineGame.state.history} players={players} teamLabel={teamLabel} />
        </>}
    </section>}

    {mode === "online" && isSignedIn && !onlineGame && <section className="game-lobby-panel">
      <div className="game-panel-heading"><div><div className="eyebrow">Open match lobby</div><h3>Challenge another fan</h3><p>Create a match, or join a signed-in fan who is waiting.</p></div><button className="thin-button" disabled={busy} onClick={() => void refreshOnline()}>Refresh list</button></div>
      {error && <div className="game-error" role="alert">{error}</div>}
      {openGames.length
        ? <div className="game-open-list">{openGames.map(game => <article className="game-open-card" key={game.id}><div><span className="game-live-dot" />OPEN MATCH<h4>Five-player lineup</h4><p>{renderRosterNames(game.homeRoster)}</p></div><button className="secondary-button" disabled={busy || Boolean(rosterError)} onClick={() => void joinOnlineGame(game.id)}>Join match</button></article>)}</div>
        : <div className="game-lobby-empty">No open matches right now. Create one and a fan can join when they’re ready.</div>}
    </section>}

    {error && currentStatus !== "none" && <div className="game-error" role="alert">{error}</div>}
    {message && <p className="game-status-message" role="status">{message}</p>}
    <p className="game-rules-note">Player ratings influence each play’s yards. Every possession gives the offense up to six plays to score: a touchdown scores 7, and reaching field-goal range by play six earns 3. Otherwise, the ball turns over on downs. Matches last six possessions total. Bot games run in this tab; online games save every play and score to your account.</p>
  </section>;
}

function DriveFeed({
  history,
  players,
  teamLabel
}: {
  history: GameState["history"];
  players: PlayerProfile[];
  teamLabel: (side: "home" | "away") => string;
}) {
  if (!history.length) return null;
  const callName: Record<OffensiveCall, string> = { run: "Inside run", quick_pass: "Quick pass", deep_pass: "Deep shot" };
  const defenseName: Record<DefensiveCall, string> = { stack_box: "Stacked box", zone: "Zone", blitz: "Blitz" };
  return <section className="game-drive-feed" aria-label="Play-by-play game log">
    <div className="game-feed-heading"><div><div className="eyebrow">Play-by-play</div><h3>Play log</h3></div><span>{history.length} PLAYS</span></div>
    {history.map((drive, index) => <article className="game-drive-row" key={`${index}-${drive.offense}-${drive.yards}`}>
      <span className="game-drive-number">{String(drive.driveNumber || index + 1).padStart(2, "0")}.{drive.playNumber || 1}</span>
      <div><b>{teamLabel(drive.offense)} · {callName[drive.offenseCall]} vs {defenseName[drive.defenseCall]}</b><small>{drive.message}{drive.possessionEnded && drive.yards > 0 ? ` Last play: ${drive.yards} yards.` : ""}</small></div>
      <strong className={drive.points ? "scored" : ""}>{drive.points ? `+${drive.points}` : drive.turnoverOnDowns ? "TO" : "—"}</strong>
    </article>)}
  </section>;
}
