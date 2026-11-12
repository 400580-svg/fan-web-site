"use client";

import { useMemo } from "react";
import { drivesPerGame, playsPerDrive, type GameState } from "@/lib/game-engine";
import type { PlayerProfile } from "@/lib/player-directory";

type Props = {
  state: GameState | Omit<GameState, "pending">;
  players: PlayerProfile[];
  isAnimating: boolean;
};

const yardlineXs = Array.from({ length: 11 }, (_, index) => 120 + index * 66);
const offenseTokens = [
  { key: "wr1", label: "WR", x: 332, y: 76 },
  { key: "wr2", label: "WR", x: 332, y: 244 },
  { key: "qb", label: "QB", x: 370, y: 160 },
  { key: "rb", label: "RB", x: 340, y: 190 },
  { key: "te", label: "TE", x: 355, y: 218 }
];
const defenseTokens = [
  { key: "dl1", label: "DL", x: 425, y: 120 },
  { key: "dl2", label: "DL", x: 430, y: 152 },
  { key: "dl3", label: "DL", x: 430, y: 184 },
  { key: "dl4", label: "DL", x: 425, y: 216 },
  { key: "lb1", label: "LB", x: 478, y: 150 },
  { key: "lb2", label: "LB", x: 478, y: 190 },
  { key: "db1", label: "DB", x: 538, y: 78 },
  { key: "db2", label: "DB", x: 540, y: 242 },
  { key: "s1", label: "S", x: 600, y: 126 },
  { key: "s2", label: "S", x: 600, y: 194 }
];

export default function DriveSimulation({ state, players, isAnimating }: Props) {
  const lastDrive = state.lastDrive;
  const lastPlayEnded = lastDrive ? lastDrive.possessionEnded ?? true : false;
  const isFinal = state.drivesCompleted >= drivesPerGame;
  const offenseSide = lastDrive && (isAnimating || !lastPlayEnded || isFinal) ? lastDrive.offense : state.currentOffense;
  const offenseIds = offenseSide === "home" ? state.homeRoster : state.awayRoster;
  const offensePlayerNames = useMemo(() => offenseIds.map(id => players.find(player => player.id === id)?.name || "Player"), [offenseIds, players]);
  const callClass = lastDrive ? `play-${lastDrive.offenseCall}` : "play-opening";
  const yards = lastDrive?.yards || 0;
  const direction = offenseSide === "home" ? 1 : -1;
  const mirror = offenseSide === "away" ? -1 : 1;
  const fieldStart = offenseSide === "home" ? 410 : 490;
  const isShowingLastPossession = lastDrive?.offense === offenseSide;
  const visualDriveYards = isShowingLastPossession ? lastDrive.driveYards : 0;
  const yardsBeforePlay = isShowingLastPossession ? lastDrive.driveYards - lastDrive.yards : 0;
  const driveProgressYards = isAnimating ? yardsBeforePlay : visualDriveYards;
  const ballStartX = Math.max(130, Math.min(770, fieldStart + direction * yardsBeforePlay * 11.25));
  const ballEndX = Math.max(130, Math.min(770, fieldStart + direction * visualDriveYards * 11.25));
  const gain = isAnimating ? ballEndX - ballStartX : 0;
  const unitGain = gain * mirror;
  const unitDriveOffset = direction * driveProgressYards * 11.25 * mirror;
  const ballX = isAnimating ? ballStartX : ballEndX;
  const targetY = lastDrive?.offenseCall === "deep_pass" ? -68 : lastDrive?.offenseCall === "quick_pass" ? -38 : 0;
  const scoringLabel = lastDrive?.points === 7 ? "TOUCHDOWN" : lastDrive?.points === 3 ? "FIELD GOAL" : "";
  const scoringCallout = lastDrive?.points === 7 ? "TOUCHDOWN · +7" : lastDrive?.points === 3 ? "FIELD GOAL · +3" : lastDrive?.turnoverOnDowns ? "TURNOVER ON DOWNS" : "";
  const lineOfScrimmage = isAnimating ? ballStartX : ballX;
  const possessionNumber = isAnimating && lastDrive?.possessionEnded
    ? lastDrive.driveNumber
    : Math.min(state.drivesCompleted + 1, drivesPerGame);
  const playNumber = (isAnimating || isFinal) && lastDrive
    ? lastDrive.playNumber
    : Math.min(state.playsInDrive + 1, playsPerDrive);
  const callLabel = lastDrive
    ? lastDrive.offenseCall === "run" ? "Inside run"
      : lastDrive.offenseCall === "quick_pass" ? "Quick pass"
        : "Deep shot"
    : "Opening drive";
  const announcement = lastDrive
    ? `${callLabel}: ${lastDrive.possessionEnded && lastDrive.yards > 0 ? `${lastDrive.yards} yards on the final play. ` : ""}${lastDrive.message}`
    : "Choose a play call to start the simulation.";

  return <section className={`drive-simulation ${callClass} ${offenseSide === "away" ? "away-on-offense" : ""} ${isAnimating ? "is-animating" : ""}`} style={{
    "--gain": `${gain}px`,
    "--gain-late": `${gain * 0.6}px`,
    "--unit-gain": `${unitGain}px`,
    "--unit-run-extra": `${Math.max(-18, Math.min(18, unitGain * 0.35))}px`,
    "--pursuit-x": `${-mirror * 32}px`,
    "--target-y": `${targetY}px`,
    "--target-y-mid": `${targetY * 0.55}px`,
    "--ball-x": `${ballX}px`
  } as React.CSSProperties} aria-label="Animated football play simulation">
    <div className="drive-sim-head">
      <div><span className="drive-sim-kicker"><i /> LIVE GAME SIMULATION</span><h3>{offenseSide === "home" ? "HOME" : "AWAY"} <span>ON OFFENSE</span></h3></div>
      <div className="drive-sim-possession"><small>POSSESSION {possessionNumber} / {drivesPerGame} · PLAY {playNumber} / {playsPerDrive}</small><b>{callLabel}</b></div>
    </div>
    <div className="drive-field-wrap">
      <svg className="drive-field" viewBox="0 0 900 320" role="img" aria-label={`Football field showing ${callLabel.toLowerCase()}${lastDrive ? ` for ${lastDrive.yards} yards${scoringLabel ? `, ${scoringLabel.toLowerCase()}` : ""}` : ""}`}>
        <rect x="26" y="24" width="848" height="272" rx="5" fill="#0b553d" />
        <rect x="48" y="38" width="804" height="244" rx="2" fill="#14754f" />
        <rect x="48" y="38" width="82" height="244" fill="#096349" />
        <rect x="770" y="38" width="82" height="244" fill="#096349" />
        {yardlineXs.map((x, index) => <g key={x}>
          <line x1={x} y1="38" x2={x} y2="282" stroke="rgba(235,255,244,.48)" strokeWidth={index % 5 === 0 ? 2 : 1} />
          {index > 0 && index < 10 && <text x={x + 8} y="62" className="field-yard-number">{index * 10}</text>}
          {index > 0 && index < 10 && <text x={x + 8} y="264" className="field-yard-number">{index * 10}</text>}
          <line x1={x} y1="121" x2={x} y2="128" stroke="rgba(235,255,244,.62)" />
          <line x1={x} y1="192" x2={x} y2="199" stroke="rgba(235,255,244,.62)" />
        </g>)}
        <text x="89" y="164" className="field-endzone">HOME</text>
        <text x="789" y="164" className="field-endzone">AWAY</text>
        <g className={`field-play-markers ${isAnimating ? "is-moving" : ""}`} transform={`translate(${lineOfScrimmage} 0)`}>
          <line x1="0" y1="38" x2="0" y2="282" className="field-line-scrimmage" />
          <line x1={direction * 112.5} y1="38" x2={direction * 112.5} y2="282" className="field-line-firstdown" />
          <text x="0" y="30" className="field-line-label">BALL</text>
          <text x={direction * 112.5} y="30" className="field-line-label first-down">TO GO</text>
        </g>
        <path d={`M ${ballStartX} 160 Q ${(ballStartX + ballEndX) / 2} ${92 + targetY / 3} ${ballEndX} ${160 + targetY}`} className="field-pass-arc" />
        <g className="field-goalpost" transform={`translate(${offenseSide === "home" ? 790 : 110} 160)`}>
          <path d="M 0 -23 V 0 M -15 -23 H 15 M -15 -23 V -13 M 15 -23 V -13" />
        </g>
        <g className="field-offense" transform={offenseSide === "away" ? "translate(820 0) scale(-1 1)" : undefined}>
          <g className={`field-team-shift ${isAnimating ? "is-advancing" : ""}`} transform={`translate(${unitDriveOffset} 0)`}>
            {offenseTokens.map(token => <g className={`sim-token sim-${token.key}`} key={token.key} transform={`translate(${token.x} ${token.y})`}>
              <circle r="17" className="sim-token-disc sim-offense-disc" />
              <text className="sim-token-label" textAnchor="middle" dominantBaseline="central">{token.label}</text>
            </g>)}
          </g>
        </g>
        <g className="field-defense" transform={offenseSide === "away" ? "translate(820 0) scale(-1 1)" : undefined}>
          <g className={`field-team-shift ${isAnimating ? "is-advancing" : ""}`} transform={`translate(${unitDriveOffset} 0)`}>
            {defenseTokens.map(token => <g className={`sim-token sim-${token.key}`} key={token.key} transform={`translate(${token.x} ${token.y})`}>
              <circle r="13" className="sim-token-disc sim-defense-disc" />
              <text className="sim-token-label sim-defense-label" textAnchor="middle" dominantBaseline="central">{token.label}</text>
            </g>)}
          </g>
        </g>
        <g className={`sim-ball ${isAnimating && scoringLabel ? "ball-scoring" : ""}`} transform={`translate(${ballX} 160)`}>
          <ellipse rx="10" ry="6" fill="#8a471e" stroke="#fff1c2" strokeWidth="1.5" />
          <path d="M -4 0h8M -1 -3v6M 2 -3v6" stroke="#fff1c2" strokeWidth=".8" />
        </g>
        {scoringCallout && <g className={`field-score-callout ${isAnimating ? "is-arriving" : ""} ${lastDrive?.points ? "is-score" : "is-turnover"}`}>
          <rect x="302" y="119" width="296" height="76" rx="8" />
          <text x="450" y="151" className="field-score-title">{scoringCallout}</text>
          <text x="450" y="174" className="field-score-subtitle">{lastDrive?.message}</text>
        </g>}
      </svg>
    </div>
    <div className="drive-sim-bottom">
      <span className="drive-sim-state">{isAnimating ? "PLAY IN MOTION" : lastDrive ? `PLAY ${lastDrive.playNumber || 1} · ${lastDrive.driveYards ?? lastDrive.yards} DRIVE YARDS · ${lastDrive.points ? `${lastDrive.points} POINTS` : lastPlayEnded ? "POSSESSION OVER" : `${playsPerDrive - state.playsInDrive} PLAYS LEFT`}` : "READY FOR THE SNAP"}</span>
      <span className="drive-sim-roster" title={offensePlayerNames.join(", ")}>{offensePlayerNames.slice(0, 3).join(" · ")}{offensePlayerNames.length > 3 ? " +" : ""}</span>
    </div>
    <p className={`drive-sim-announcement ${lastDrive?.points ? "has-score" : ""}`} aria-live="polite">{isAnimating ? `Ball snapped — ${callLabel.toLowerCase()} in motion.` : announcement}</p>
  </section>;
}
