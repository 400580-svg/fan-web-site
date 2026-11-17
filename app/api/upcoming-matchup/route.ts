type EspnTeam = {
  id: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
};

type EspnCompetitor = {
  homeAway: "home" | "away";
  team: EspnTeam;
  records?: { name?: string; summary?: string }[];
};

type EspnEvent = {
  id: string;
  name: string;
  date: string;
  competitions?: {
    status?: { type?: { state?: string; detail?: string } };
    venue?: { fullName?: string };
    competitors?: EspnCompetitor[];
  }[];
};

function easternDateKey(dayOffset: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(value => value.type === type)?.value;
  const year = Number(part("year"));
  const month = Number(part("month"));
  const day = Number(part("day"));
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

async function getScoreboardEvents(dateKey: string): Promise<EspnEvent[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${dateKey}&limit=100`;
  const response = await fetch(url, { next: { revalidate: 180 } });
  if (!response.ok) throw new Error(`ESPN schedule returned ${response.status}.`);
  const data = await response.json() as { events?: EspnEvent[] };
  return Array.isArray(data.events) ? data.events : [];
}

export async function GET() {
  try {
    const eventLists = await Promise.allSettled(
      // Cover the Chargers' next game across a bye week as well as a normal week.
      Array.from({ length: 15 }, (_, dayOffset) => getScoreboardEvents(easternDateKey(dayOffset)))
    );
    const events = eventLists.flatMap(result => result.status === "fulfilled" ? result.value : []);
    const nextGame = events
      .filter(event => Date.parse(event.date) > Date.now())
      .filter(event => event.competitions?.[0]?.status?.type?.state === "pre")
      .filter(event => event.competitions?.[0]?.competitors?.some(
        competitor => competitor.team.abbreviation === "LAC" || competitor.team.displayName === "Los Angeles Chargers"
      ))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0];

    if (!nextGame) {
      return Response.json(
        { error: "No upcoming Chargers game was found in the schedule." },
        { status: eventLists.some(result => result.status === "rejected") ? 502 : 404 }
      );
    }

    const competition = nextGame.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const home = competitors.find(team => team.homeAway === "home");
    const away = competitors.find(team => team.homeAway === "away");
    if (!home || !away) {
      return Response.json({ error: "The next game is missing team details." }, { status: 502 });
    }

    const formatTeam = (team: EspnCompetitor) => ({
      id: team.team.id,
      abbreviation: team.team.abbreviation,
      name: team.team.displayName,
      logo: team.team.logo ?? null,
      record: team.records?.find(record => record.name === "overall")?.summary ?? null
    });

    return Response.json({
      id: nextGame.id,
      startsAt: nextGame.date,
      venue: competition?.venue?.fullName ?? null,
      status: competition?.status?.type?.detail ?? "Scheduled",
      homeTeam: formatTeam(home),
      awayTeam: formatTeam(away),
      sourceUrl: "https://www.espn.com/nfl/schedule"
    });
  } catch (error) {
    console.error("Could not load the upcoming Chargers matchup.", error);
    return Response.json({ error: "The Chargers schedule is temporarily unavailable." }, { status: 502 });
  }
}
