export type SeasonRatingInput = {
  id: string;
  position: string;
  games: number;
  passingYards: number | null;
  rushingYards: number | null;
  receivingYards: number | null;
};

export type SitePlayerRating = 1 | 2 | 3 | 4 | 5 | null;

function primarySeasonYards(player: SeasonRatingInput): number | null {
  const yards = player.position === "QB"
    ? player.passingYards
    : player.position === "RB"
      ? player.rushingYards
      : player.receivingYards;
  return player.games > 0 && typeof yards === "number" && Number.isFinite(yards)
    ? yards
    : null;
}

export function calculate2026SiteRatings(
  players: readonly SeasonRatingInput[]
): Record<string, SitePlayerRating> {
  const ratings: Record<string, SitePlayerRating> = Object.fromEntries(
    players.map(player => [player.id, null])
  );
  const byPosition = new Map<string, Array<{ id: string; yards: number }>>();

  for (const player of players) {
    const yards = primarySeasonYards(player);
    if (yards === null) continue;
    const positionGroup = byPosition.get(player.position) ?? [];
    positionGroup.push({ id: player.id, yards });
    byPosition.set(player.position, positionGroup);
  }

  for (const positionGroup of byPosition.values()) {
    const ranked = [...positionGroup].sort((a, b) => b.yards - a.yards);
    let start = 0;

    while (start < ranked.length) {
      let end = start;
      while (end + 1 < ranked.length && ranked[end + 1].yards === ranked[start].yards) end++;

      const averageRank = (start + end) / 2;
      const stars = Math.max(1, Math.min(5, Math.ceil(((ranked.length - averageRank) / ranked.length) * 5))) as 1 | 2 | 3 | 4 | 5;
      for (let index = start; index <= end; index++) ratings[ranked[index].id] = stars;
      start = end + 1;
    }
  }

  return ratings;
}
