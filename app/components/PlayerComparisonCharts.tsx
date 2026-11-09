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
  rating: string;
  metric: string;
};

export default function PlayerComparisonCharts({
  players,
  fanRatings
}: {
  players: PlayerForChart[];
  fanRatings: Record<string, number>;
}) {
  if (players.length < 2) return null;

  const first = players[0];
  const second = players[1];
  const firstStat = Number(first.metric.replace(/,/g, "")) || 0;
  const secondStat = Number(second.metric.replace(/,/g, "")) || 0;
  const maxStat = Math.max(firstStat, secondStat, 1);
  const radarData = [
    { axis: "Sample grade", first: Number(first.rating), second: Number(second.rating) },
    { axis: "Sample stat index", first: Math.round(firstStat / maxStat * 100), second: Math.round(secondStat / maxStat * 100) },
    { axis: "Fan rating", first: (fanRatings[first.id] || 0) * 20, second: (fanRatings[second.id] || 0) * 20 }
  ];
  const gradeData = [
    { player: first.name, grade: Number(first.rating) },
    { player: second.name, grade: Number(second.rating) }
  ];

  return <section className="comparison-charts" aria-label="Illustrative player charts">
    <article className="panel chart-card">
      <header className="panel-header"><div><div className="panel-title">Profile radar</div><div className="panel-caption">Pair-normalized sample measures, not official stats.</div></div><span className="panel-tag">DEMO</span></header>
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
      <header className="panel-header"><div><div className="panel-title">Sample grade</div><div className="panel-caption">Illustrative grade scale from 0 to 100.</div></div><span className="panel-tag">DEMO</span></header>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -18, bottom: 6 }}>
            <CartesianGrid stroke="#e8eef2" strokeDasharray="3 3" />
            <XAxis dataKey="player" tick={{ fill: "#6e7e8e", fontSize: 9 }} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fill: "#8796a2", fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="grade" name="Sample grade" fill="#0080C6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  </section>;
}
