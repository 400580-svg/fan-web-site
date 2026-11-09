"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "Overview" | "Players" | "Matchup lab" | "Playbook" | "Lineups" | "Film room";
type Player = { id: string; name: string; team: string; position: string; number: string; rating: string; metric: string; metricLabel: string; initials: string; note: string };
type Play = { id: string; name: string; formation: string; personnel: string; concept: string; situation: string; note: string };
type Lineup = { id: string; name: string; format: string; quarterback: string; runningBack: string; receiver: string; tightEnd: string; note: string };
type ModalState = { kind: "play" | "lineup"; item?: Play | Lineup } | null;

const demoPlayers: Player[] = [
  { id: "p1", name: "Justin Herbert", team: "Los Angeles Chargers", position: "QB", number: "10", rating: "94.2", metric: "4,108", metricLabel: "Pass yds", initials: "JH", note: "Quick-game accuracy and layered throws" },
  { id: "p2", name: "Patrick Mahomes", team: "Kansas City Chiefs", position: "QB", number: "15", rating: "96.8", metric: "4,183", metricLabel: "Pass yds", initials: "PM", note: "Off-platform creation and red-zone reads" },
  { id: "p3", name: "Lamar Jackson", team: "Baltimore Ravens", position: "QB", number: "8", rating: "95.1", metric: "3,678", metricLabel: "Pass yds", initials: "LJ", note: "Designed run threat reshapes the box" },
  { id: "p4", name: "CeeDee Lamb", team: "Dallas Cowboys", position: "WR", number: "88", rating: "92.7", metric: "1,749", metricLabel: "Rec yds", initials: "CL", note: "Elite separation from the slot" },
  { id: "p5", name: "Christian McCaffrey", team: "San Francisco 49ers", position: "RB", number: "23", rating: "94.5", metric: "1,459", metricLabel: "Rush yds", initials: "CM", note: "Three-down mismatch creator" },
  { id: "p6", name: "A.J. Brown", team: "Philadelphia Eagles", position: "WR", number: "11", rating: "91.6", metric: "1,456", metricLabel: "Rec yds", initials: "AB", note: "Power release wins outside leverage" },
  { id: "p7", name: "Travis Kelce", team: "Kansas City Chiefs", position: "TE", number: "87", rating: "89.8", metric: "984", metricLabel: "Rec yds", initials: "TK", note: "Finds soft spots against zone" },
  { id: "p8", name: "Josh Allen", team: "Buffalo Bills", position: "QB", number: "17", rating: "93.4", metric: "4,306", metricLabel: "Pass yds", initials: "JA", note: "Arm talent stretches every coverage" },
  { id: "p9", name: "Tyreek Hill", team: "Miami Dolphins", position: "WR", number: "10", rating: "93.1", metric: "1,799", metricLabel: "Rec yds", initials: "TH", note: "Motion and vertical speed stress rules" }
];
const demoPlays: Play[] = [
  { id: "d1", name: "Blue Orbit", formation: "Gun Trips Right", personnel: "11 personnel", concept: "Choice / Sail", situation: "2nd & medium", note: "Read the nickel leverage. Alert the boundary fade if the safety rotates down." },
  { id: "d2", name: "Gold Rush", formation: "I-Form Close", personnel: "21 personnel", concept: "Outside Zone", situation: "Red zone", note: "Sell split flow before the back presses the outside hip." }
];
const demoLineups: Lineup[] = [
  { id: "l1", name: "Sunday Pressure", format: "Fantasy · PPR", quarterback: "Justin Herbert", runningBack: "Christian McCaffrey", receiver: "CeeDee Lamb", tightEnd: "Travis Kelce", note: "High-floor core with a premium receiving back." }
];
const experts = [
  { name: "The Play Caller", role: "Offensive coordinator lens", text: "Build the opening script around motion to identify man coverage. Give the quarterback a fast answer before asking the protection to hold up.", pick: "Offensive rhythm" },
  { name: "The Coverage Tech", role: "Defensive backfield lens", text: "Show two-high, then spin late. Make the offense confirm the post-snap picture and rally to short completions instead of gifting explosives.", pick: "Late rotation" },
  { name: "The Trench Report", role: "Line play lens", text: "The matchup is won by the first step, not the highlight. A wide alignment can create a clean inside counter if the tackle oversets.", pick: "Inside counter" },
  { name: "The Numbers Desk", role: "Efficiency lens", text: "Early-down success keeps the call sheet open. Stay ahead of the sticks and the offense can preserve its full menu on third down.", pick: "Stay on schedule" },
  { name: "The Fantasy Angle", role: "Usage lens", text: "Volume is the signal. Routes and touches in high-value areas matter more than last week's touchdown; track the role before chasing the result.", pick: "Target share" },
  { name: "The Film Room", role: "Player development lens", text: "Watch the eyes and the feet together. When the quarterback resets cleanly after the first read, the second window opens on time.", pick: "Rhythm + reset" }
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
  const [view, setView] = useState<View>("Overview");
  const [players, setPlayers] = useState(demoPlayers);
  const [plays, setPlays] = useState(demoPlays);
  const [lineups, setLineups] = useState(demoLineups);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("All positions");
  const [selected, setSelected] = useState<string[]>(["p1", "p2"]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const [editName, setEditName] = useState("");
  const [formError, setFormError] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const savedPlays = localStorage.getItem("gc-plays");
      const savedLineups = localStorage.getItem("gc-lineups");
      if (savedPlays) setPlays(JSON.parse(savedPlays) as Play[]);
      if (savedLineups) setLineups(JSON.parse(savedLineups) as Lineup[]);
    } catch { setToast("Saved items could not be loaded. Your current session is still available."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("gc-plays", JSON.stringify(plays)); localStorage.setItem("gc-lineups", JSON.stringify(lineups)); }
    catch { setToast("Browser storage is full. Changes may not persist."); }
  }, [plays, lineups, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPlayers = useMemo(() => players.filter(player => {
    const matchesText = `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (position === "All positions" || player.position === position);
  }), [players, query, position]);
  const comparePlayers = selected.map(id => players.find(player => player.id === id)).filter((player): player is Player => Boolean(player));
  const openEditor = (kind: "play" | "lineup", item?: Play | Lineup) => {
    setFormError("");
    setModal({ kind, item });
    if (!item) { setEditName(""); setFormValues({}); return; }
    setEditName(item.name);
    if (kind === "play") {
      const play = item as Play;
      setFormValues({ formation: play.formation, personnel: play.personnel, concept: play.concept, situation: play.situation, note: play.note });
    } else {
      const lineup = item as Lineup;
      setFormValues({ format: lineup.format, quarterback: lineup.quarterback, runningBack: lineup.runningBack, receiver: lineup.receiver, tightEnd: lineup.tightEnd, note: lineup.note });
    }
  };
  const saveItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editName.trim()) { setFormError("Give this entry a name before saving."); return; }
    if (modal?.kind === "play") {
      const next: Play = { id: (modal.item as Play | undefined)?.id || `play-${Date.now()}`, name: editName.trim(), formation: formValues.formation || "Shotgun", personnel: formValues.personnel || "11 personnel", concept: formValues.concept || "Quick game", situation: formValues.situation || "Any down", note: formValues.note || "" };
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
    if (!window.confirm("Delete this item? This only removes it from this browser.")) return;
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
  const goto = (next: View) => { setView(next); setQuery(""); };
  const resource = modal?.kind === "play" ? "play" : "lineup";
  const isEditing = Boolean(modal?.item);

  const navItems: { title: View; icon: string }[] = [
    { title: "Overview", icon: "grid" }, { title: "Players", icon: "users" }, { title: "Matchup lab", icon: "compare" }, { title: "Playbook", icon: "book" }, { title: "Lineups", icon: "lineup" }, { title: "Film room", icon: "film" }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Icon name="shield" size={21} /></div><div className="brand-name">GRIDIRON<span>CENTRAL</span></div></div>
      <div className="side-label">Game center</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(item => <button key={item.title} className={`nav-item ${view === item.title ? "active" : ""}`} onClick={() => goto(item.title)} aria-current={view === item.title ? "page" : undefined}><span className="nav-icon"><Icon name={item.icon} size={17} /></span>{item.title}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="side-label">Season snapshot</div>
        <div className="season-card"><div className="season-label">The film room</div><div className="season-value">2024 <span style={{ color: "var(--gold)", fontSize: 11 }}>DEMO</span></div><div className="season-status"><i className="dot" /> Sample data set</div></div>
        <div className="profile"><div className="profile-avatar">GC</div><div><div className="profile-name">Gridiron Guest</div><div className="profile-sub">Local workspace</div></div></div>
      </div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">GRIDIRON CENTRAL <span style={{ margin: "0 7px", color: "#c0cbd3" }}>/</span> <b>{view.toUpperCase()}</b></div><div className="top-actions"><span className="live-pill"><i /> LOCAL WORKSPACE</span><button className="icon-button" aria-label="Notifications" onClick={() => setToast("You are all caught up.")}><Icon name="bell" size={16} /></button></div></header>
      <div className="content">
        {view === "Overview" && <>
          <section className="hero">
            <div className="hero-copy"><div className="hero-kicker"><span>Week 01</span> / The season starts in the details</div><h1>See the game<br /><em>differently.</em></h1><p>Go beyond the box score. Break down the matchups, build your playbook, and find the edges that change Sundays.</p><button className="hero-cta" onClick={() => goto("Matchup lab")}>OPEN MATCHUP LAB <Icon name="arrow" size={15} /></button></div>
            <div className="hero-note"><b>FILM FIRST. ALWAYS.</b>TACTICAL INSIGHT / FAN-POWERED</div>
          </section>
          <div className="section-head"><div><div className="eyebrow">The lay of the land</div><h2>Sunday, at a glance</h2></div><button className="text-button" onClick={() => goto("Players")}>Explore player directory <Icon name="arrow" size={14} /></button></div>
          <div className="stat-strip">
            <div className="stat-card"><div><div className="stat-label">Players scouted</div><div className="stat-value">{players.length}</div><div className="stat-meta">SAMPLE DIRECTORY</div></div><div className="stat-mark"><Icon name="users" size={16} /></div></div>
            <div className="stat-card"><div><div className="stat-label">Your playbook</div><div className="stat-value">{plays.length}</div><div className="stat-meta">SAVED CONCEPTS</div></div><div className="stat-mark"><Icon name="book" size={16} /></div></div>
            <div className="stat-card"><div><div className="stat-label">Lineup boards</div><div className="stat-value">{lineups.length}</div><div className="stat-meta">LOCAL ROSTERS</div></div><div className="stat-mark"><Icon name="lineup" size={16} /></div></div>
            <div className="stat-card"><div><div className="stat-label">Film room</div><div className="stat-value">06</div><div className="stat-meta">SIMULATED LENSES</div></div><div className="stat-mark"><Icon name="film" size={16} /></div></div>
          </div>
          <div className="dashboard-grid">
            <section className="panel"><header className="panel-header"><div><div className="panel-title">Matchup of the week</div><div className="panel-caption">A sample tactical prompt to get your film session started.</div></div><span className="panel-tag">FEATURED</span></header>
              <div className="matchup-feature"><div className="team-side"><div className="team-badge">LAC</div><div><div className="team-meta">AFC WEST</div><div className="team-name">Chargers</div><div className="team-detail">Justin Herbert · QB</div></div></div><div className="versus">VS</div><div className="team-side right"><div className="team-badge">KC</div><div><div className="team-meta">AFC WEST</div><div className="team-name">Chiefs</div><div className="team-detail">Patrick Mahomes · QB</div></div></div></div>
              <div className="match-foot"><small>Focus: pressure answers &amp; coverage rotation</small><button className="thin-button" onClick={() => { setSelected(["p1", "p2"]); goto("Matchup lab"); setComparisonOpen(true); }}>Break it down <Icon name="arrow" size={12} /></button></div>
            </section>
            <section className="panel"><header className="panel-header"><div><div className="panel-title">Names to know</div><div className="panel-caption">Sample leaders for your next film session.</div></div><Icon name="trend" size={17} /></header><div className="trend-card">
              {[["01", "CeeDee Lamb", "WR · Cowboys", "1,749 yds"], ["02", "Christian McCaffrey", "RB · 49ers", "2,023 scrim"], ["03", "Tyreek Hill", "WR · Dolphins", "1,799 yds"]].map(row => <div className="trend-row" key={row[1]}><span className="trend-number">{row[0]}</span><div className="trend-copy"><div className="trend-name">{row[1]}</div><div className="trend-meta">{row[2]}</div></div><div className="trend-value">{row[3]}</div></div>)}
            </div></section>
          </div>
          <div className="section-head"><div><div className="eyebrow">Get into the details</div><h2>Choose your angle</h2></div></div>
          <div className="stat-strip">
            {[["Player directory", "Search the sample player pool by name, position, or team.", "Players", "users"], ["Build your playbook", "Save formations, concepts, and the situations they fit.", "Playbook", "book"], ["Set your lineup", "Put a custom roster board together for your league.", "Lineups", "lineup"], ["Six football lenses", "Compare tactical perspectives from a simulated panel.", "Film room", "film"]].map(([title, desc, destination, icon]) => <button className="stat-card" key={title} onClick={() => goto(destination as View)} style={{ textAlign: "left", width: "100%", border: "1px solid var(--line)" }}><div><div className="stat-label">{title}</div><div className="section-sub" style={{ maxWidth: 195, lineHeight: 1.45 }}>{desc}</div></div><div className="stat-mark"><Icon name={icon} size={16} /></div></button>)}
          </div>
        </>}

        {view === "Players" && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">The player pool</div><h2>Player directory</h2><div className="section-sub">Search the sample dataset. Numbers are illustrative, not official or current NFL stats.</div></div><button className="primary-button" onClick={() => { if (selected.length !== 2) { setToast("Select exactly two players to compare."); return; } setComparisonOpen(true); }}>Compare selected <Icon name="compare" size={14} /> {selected.length}/2</button></div>
          <div className="section-toolbar"><label className="search-box"><Icon name="search" size={15} /><input aria-label="Search players" placeholder="Search players, teams, or positions..." value={query} onChange={event => setQuery(event.target.value)} /></label><div className="toolbar-filters"><select className="select-control" aria-label="Filter by position" value={position} onChange={event => setPosition(event.target.value)}>{["All positions", "QB", "RB", "WR", "TE"].map(value => <option key={value}>{value}</option>)}</select></div></div>
          {filteredPlayers.length ? <div className="player-grid">{filteredPlayers.map(player => <article className="player-card" key={player.id}><div className="player-top"><div className="player-avatar">{player.initials}</div><div><div className="player-name">{player.name}</div><div className="player-team">#{player.number} · {player.team}</div></div><span className="position-tag">{player.position}</span></div><div className="player-stats"><div className="player-stat"><span>Grade*</span><b>{player.rating}</b></div><div className="player-stat"><span>{player.metricLabel}</span><b>{player.metric}</b></div><div className="player-stat"><span>Scout note</span><b style={{ font: "600 10px var(--font-body)", lineHeight: 1.3, marginTop: 6 }}>{player.note.split(" ").slice(0, 3).join(" ")}</b></div></div><div className="player-bottom"><span className="demo-badge">*Illustrative sample</span><label className="compare-check"><input type="checkbox" checked={selected.includes(player.id)} onChange={() => togglePlayer(player.id)} /> Compare</label></div></article>)}</div> : <div className="empty-state"><strong>No players in this huddle</strong><p>Try a different name or position filter.</p><button className="secondary-button" onClick={() => { setQuery(""); setPosition("All positions"); }}>Clear filters</button></div>}
          <p className="demo-badge" style={{ marginTop: 13 }}>All player data on this page is sample/demo content; it is not an official NFL feed.</p>
        </section>}

        {view === "Matchup lab" && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">Head-to-head breakdown</div><h2>Matchup lab</h2><div className="section-sub">Select two players in the directory or use the sample matchup below.</div></div><button className="secondary-button" onClick={() => goto("Players")}>Browse players <Icon name="arrow" size={13} /></button></div>
          <div className="notice">Demo mode: player records and measurements are illustrative sample data, not official or live statistics. Use the panels as a football conversation starter.</div>
          <div className="comparison">{(comparePlayers.length === 2 ? comparePlayers : [players[0], players[1]]).map((player, index) => <div className="comparison-side" key={player.id}><div className="comparison-head"><small>{index === 0 ? "OFFENSE / 01" : "OFFENSE / 02"} · {player.position}</small><h3>{player.name}</h3></div><div className="compare-line"><span>Team</span><b>{player.team}</b></div><div className="compare-line"><span>Sample grade</span><b>{player.rating}</b></div><div className="compare-line winner"><span>{player.metricLabel}</span><b>{player.metric}</b></div><div className="compare-line"><span>Film note</span><b style={{ fontFamily: "var(--font-body)", fontSize: 10, textAlign: "right", maxWidth: "62%" }}>{player.note}</b></div></div>)}</div>
          <div className="section-head"><div><div className="eyebrow">Six ways to see it</div><h2>Simulated analyst panel</h2></div><span className="panel-tag">DEMO ANALYSIS</span></div>
          <div className="analysis-grid">{experts.map((expert, index) => <article className="analyst-card" key={expert.name}><div className="analyst-top"><span className="analyst-number">0{index + 1}</span><div><div className="analyst-name">{expert.name}</div><div className="analyst-role">{expert.role}</div></div></div><p>{expert.text}</p><div className="analyst-pick">Key read <b>{expert.pick}</b></div></article>)}</div>
        </section>}

        {(view === "Playbook" || view === "Lineups") && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">Your local workspace</div><h2>{view === "Playbook" ? "Custom playbook" : "Lineup manager"}</h2><div className="section-sub">{view === "Playbook" ? "Capture concepts, formations, and the situations they answer." : "Keep a custom lineup board for your fantasy decisions."} Saved in this browser only.</div></div><button className="primary-button" onClick={() => openEditor(view === "Playbook" ? "play" : "lineup")}><Icon name="plus" size={15} /> {view === "Playbook" ? "Add a play" : "Create lineup"}</button></div>
          {view === "Playbook" ? <div className="panel table-panel"><table className="data-table"><thead><tr><th>Concept / play name</th><th>Formation</th><th>Personnel</th><th>Situation</th><th>Actions</th></tr></thead><tbody>{plays.map(play => <tr key={play.id}><td><strong>{play.name}</strong><div className="section-sub">{play.note || play.concept}</div></td><td>{play.formation}</td><td><span className="tag">{play.personnel}</span></td><td><span className="tag gold">{play.situation}</span></td><td><div className="table-actions"><button className="icon-button" aria-label={`Edit ${play.name}`} onClick={() => openEditor("play", play)}><Icon name="edit" size={14} /></button><button className="icon-button" aria-label={`Delete ${play.name}`} onClick={() => removeItem("play", play.id)}><Icon name="trash" size={14} /></button></div></td></tr>)}</tbody></table>{plays.length === 0 && <div className="empty-state"><strong>Your playbook is open</strong><p>Add a concept to start building your call sheet.</p><button className="primary-button" onClick={() => openEditor("play")}><Icon name="plus" size={14} /> Add your first play</button></div>}</div> :
            <div className="player-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(265px,1fr))" }}>{lineups.map(lineup => <article className="player-card" key={lineup.id}><div className="player-top"><div className="player-avatar"><Icon name="lineup" size={20} /></div><div><div className="player-name">{lineup.name}</div><div className="player-team">{lineup.format}</div></div></div><div className="player-stats" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>{[["QB", lineup.quarterback], ["RB", lineup.runningBack], ["WR", lineup.receiver], ["TE", lineup.tightEnd]].map(([pos, name]) => <div className="player-stat" key={pos}><span>{pos}</span><b style={{ font: "600 11px var(--font-body)", lineHeight: 1.25, marginTop: 6 }}>{name}</b></div>)}</div><div className="player-bottom"><span className="demo-badge">{lineup.note || "Custom lineup"}</span><div className="table-actions"><button className="icon-button" aria-label={`Edit ${lineup.name}`} onClick={() => openEditor("lineup", lineup)}><Icon name="edit" size={14} /></button><button className="icon-button" aria-label={`Delete ${lineup.name}`} onClick={() => removeItem("lineup", lineup.id)}><Icon name="trash" size={14} /></button></div></div></article>)}
              {!lineups.length && <div className="empty-state"><strong>Empty lineup board</strong><p>Build your first roster snapshot. It stays on this device.</p><button className="primary-button" onClick={() => openEditor("lineup")}><Icon name="plus" size={14} /> Create lineup</button></div>}</div>}
        </section>}

        {view === "Film room" && <section className="section-layout">
          <div className="section-head" style={{ marginTop: 4 }}><div><div className="eyebrow">The tape never lies</div><h2>Film room</h2><div className="section-sub">Six distinct simulated football lenses. For conversation and learning—not real expert commentary.</div></div><span className="panel-tag">SIMULATED / DEMO</span></div>
          <div className="notice">These are generated example perspectives, not quotes or analysis from actual NFL experts. No live game footage, data, or expert service is connected.</div>
          <div className="analysis-grid">{experts.map((expert, index) => <article className="analyst-card" key={expert.name}><div className="analyst-top"><span className="analyst-number">0{index + 1}</span><div><div className="analyst-name">{expert.name}</div><div className="analyst-role">{expert.role}</div></div></div><p>{expert.text}</p><div className="analyst-pick">Angle to watch <b>{expert.pick}</b></div></article>)}</div>
          <section className="panel" style={{ marginTop: 14 }}><header className="panel-header"><div><div className="panel-title">One question for the tape</div><div className="panel-caption">Bring a clear question to your next watch-through.</div></div><div className="stat-mark"><Icon name="play" size={15} /></div></header><div style={{ padding: "0 18px 18px", color: "#5d7180", fontSize: 12, lineHeight: 1.7 }}>When the defense rotates late, which receiver gets the cleanest leverage—and how does the quarterback's footwork tell you he saw it?</div></section>
        </section>}
      </div>
    </main>

    {modal && <Modal title={isEditing ? `Edit ${resource}` : `Add ${resource}`} subtitle="Your changes are saved to local storage on this device." onClose={() => setModal(null)} footer={<><button className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" type="submit" form="resource-form">{isEditing ? "Save changes" : "Create entry"}</button></>}>
      <form id="resource-form" onSubmit={saveItem}><div className="form-grid">
        <div className="field full"><label htmlFor="resource-name">{resource === "play" ? "Play / concept name" : "Lineup name"}</label><input id="resource-name" value={editName} onChange={event => setEditName(event.target.value)} placeholder={resource === "play" ? "e.g. Boundary read" : "e.g. Week 4 core"} autoFocus /></div>
        {resource === "play" ? <>
          <div className="field"><label htmlFor="formation">Formation</label><input id="formation" value={formValues.formation || ""} onChange={event => setFormValues({ ...formValues, formation: event.target.value })} placeholder="Gun Trips Right" /></div>
          <div className="field"><label htmlFor="personnel">Personnel</label><input id="personnel" value={formValues.personnel || ""} onChange={event => setFormValues({ ...formValues, personnel: event.target.value })} placeholder="11 personnel" /></div>
          <div className="field"><label htmlFor="concept">Core concept</label><input id="concept" value={formValues.concept || ""} onChange={event => setFormValues({ ...formValues, concept: event.target.value })} placeholder="Levels / spacing" /></div>
          <div className="field"><label htmlFor="situation">Situation</label><input id="situation" value={formValues.situation || ""} onChange={event => setFormValues({ ...formValues, situation: event.target.value })} placeholder="3rd & short" /></div>
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
    {comparisonOpen && <Modal title="Head-to-head" subtitle="A quick read across two sample player profiles." onClose={() => setComparisonOpen(false)}><div className="notice">Illustrative player data only. This is not a live matchup or official NFL statistical comparison.</div><div className="comparison">{(comparePlayers.length === 2 ? comparePlayers : [players[0], players[1]]).map((player, index) => <div className="comparison-side" key={player.id}><div className="comparison-head"><small>{index === 0 ? "PLAYER 01" : "PLAYER 02"} · {player.position}</small><h3>{player.name}</h3></div><div className="compare-line"><span>Team</span><b>{player.team}</b></div><div className="compare-line winner"><span>Sample grade</span><b>{player.rating}</b></div><div className="compare-line"><span>{player.metricLabel}</span><b>{player.metric}</b></div><div className="compare-line"><span>Film note</span><b style={{ fontFamily: "var(--font-body)", fontSize: 10, textAlign: "right", maxWidth: "62%" }}>{player.note}</b></div></div>)}</div><div className="dialog-footer" style={{ padding: "16px 0 0" }}><button className="primary-button" onClick={() => { setComparisonOpen(false); goto("Matchup lab"); }}>Open tactical panel <Icon name="arrow" size={13} /></button></div></Modal>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
