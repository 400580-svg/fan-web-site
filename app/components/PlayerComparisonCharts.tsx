"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type PlayerForChart = {
  id: string;
  name: string;
  passingYards: number | null;
  rushingYards: number | null;
  receivingYards: number | null;
  position: string;
  tackles?: number;
  sacks?: number;
  interceptions?: number | null;
  passesDefended?: number;
};

const offensiveStatTypes = [
  { key: "passingYards" as const, label: "Passing yards", shortLabel: "Pass yds" },
  { key: "rushingYards" as const, label: "Rushing yards", shortLabel: "Rush yds" },
  { key: "receivingYards" as const, label: "Receiving yards", shortLabel: "Rec yds" }
];
const defensiveStatTypes = [
  { key: "tackles" as const, label: "Tackles", shortLabel: "Tackles" },
  { key: "sacks" as const, label: "Sacks", shortLabel: "Sacks" },
  { key: "interceptions" as const, label: "Interceptions", shortLabel: "INT" },
  { key: "passesDefended" as const, label: "Passes defended", shortLabel: "Pass def." }
];
const isDefensivePosition = (position: string) => ["DE", "DT", "LB", "CB", "S"].includes(position);

export default function PlayerComparisonCharts({ players }: { players: PlayerForChart[] }) {
  if (players.length < 2) return null;

  const first = players[0];
  const second = players[1];
  const isDefenseComparison = isDefensivePosition(first.position) && isDefensivePosition(second.position);
  if (isDefensivePosition(first.position) !== isDefensivePosition(second.position)) {
    return <div className="notice">Choose two offensive players or two defensive players to compare matching stat types.</div>;
  }
  const statTypes = isDefenseComparison ? defensiveStatTypes : offensiveStatTypes;
  const getValue = (player: PlayerForChart, key: (typeof statTypes)[number]["key"]) => player[key] ?? 0;
  const radarData = statTypes.map(stat => {
    const firstValue = getValue(first, stat.key);
    const secondValue = getValue(second, stat.key);
    const pairMax = Math.max(firstValue, secondValue);
    return {
      axis: stat.shortLabel,
      first: pairMax ? Math.round(firstValue / pairMax * 100) : 0,
      second: pairMax ? Math.round(secondValue / pairMax * 100) : 0
    };
  });
  const yardageData = statTypes.map(stat => ({
    category: stat.shortLabel,
    first: getValue(first, stat.key),
    second: getValue(second, stat.key)
  }));

  return <section className="comparison-charts" aria-label={`2026 ${isDefenseComparison ? "defensive" : "offensive"} player statistics charts`}>
    <article className="panel chart-card">
      <header className="panel-header"><div><div className="panel-title">2026 stat profile</div><div className="panel-caption">Each axis is scaled to the higher value in this pair. No line is shown as zero.</div></div><span className="panel-tag">{isDefenseComparison ? "ESPN" : "NFL.COM"}</span></header>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke="#dce6ed" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#6e7e8e", fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#8796a2", fontSize: 8 }} tickCount={4} />
            <Radar name={first.name} dataKey="first" stroke="#0080C6" fill="#0080C6" fillOpacity={0.28} />
            <Radar name={second.name} dataKey="second" stroke="#D49D00" fill="#FFC20E" fillOpacity={0.2} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend"><span><i className="legend-blue" />{first.name}</span><span><i className="legend-gold" />{second.name}</span></div>
    </article>
    <article className="panel chart-card">
      <header className="panel-header"><div><div className="panel-title">Season stats by category</div><div className="panel-caption">2026 totals; categories reflect each player&apos;s role.</div></div><span className="panel-tag">2026</span></header>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yardageData} margin={{ top: 10, right: 10, left: -18, bottom: 6 }}>
            <CartesianGrid stroke="#e8eef2" strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fill: "#6e7e8e", fontSize: 9 }} interval={0} />
            <YAxis tick={{ fill: "#8796a2", fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="first" name={first.name} fill="#0080C6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="second" name={second.name} fill="#FFC20E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  </section>;
}
