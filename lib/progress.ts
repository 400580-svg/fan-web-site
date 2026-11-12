import { z } from "zod";

const shortText = z.string().max(160);
const id = z.string().min(1).max(120);

const playSchema = z.object({
  id,
  name: shortText,
  formation: shortText,
  personnel: shortText,
  concept: shortText,
  situation: shortText,
  note: z.string().max(2000),
  tags: z.array(shortText).max(30).optional()
}).strict();

const lineupSchema = z.object({
  id,
  name: shortText,
  format: shortText,
  quarterback: shortText,
  runningBack: shortText,
  receiver: shortText,
  tightEnd: shortText,
  note: z.string().max(2000)
}).strict();

const gamePlaySchema = z.object({
  driveNumber: z.number().int().min(1).max(6),
  playNumber: z.number().int().min(1).max(6),
  offense: z.enum(["home", "away"]),
  offenseCall: z.enum(["run", "quick_pass", "deep_pass"]),
  defenseCall: z.enum(["stack_box", "zone", "blitz"]),
  yards: z.number().int().min(-4).max(18),
  driveYards: z.number().int().min(-24).max(108),
  points: z.union([z.literal(0), z.literal(3), z.literal(7)]),
  possessionEnded: z.boolean(),
  turnoverOnDowns: z.boolean(),
  message: z.string().max(300)
}).strict();

const savedBotGameSchema = z.object({
  id,
  createdAt: z.string().datetime(),
  homeRoster: z.array(id).length(5),
  awayRoster: z.array(id).length(5),
  homeScore: z.number().int().min(0).max(42),
  awayScore: z.number().int().min(0).max(42),
  history: z.array(gamePlaySchema).max(36)
}).strict();

export const userProgressSchema = z.object({
  version: z.literal(1),
  plays: z.array(playSchema).max(250),
  lineups: z.array(lineupSchema).max(250),
  favorites: z.array(id).max(500),
  playerTags: z.record(id, z.array(shortText).max(5)).default({})
    .refine(tags => Object.keys(tags).length <= 500),
  teamPlayers: z.array(id).max(500).default([]),
  playerRatings: z.record(z.string().max(120), z.number().int().min(1).max(5))
    .refine(ratings => Object.keys(ratings).length <= 500),
  darkMode: z.boolean(),
  pollVotes: z.object({
    chargers: z.number().int().min(0).max(10_000_000),
    chiefs: z.number().int().min(0).max(10_000_000)
  }).strict(),
  userVote: z.enum(["", "chargers", "chiefs"]),
  recentlyViewed: z.array(id).max(5),
  gameHistory: z.array(savedBotGameSchema).max(20).default([])
}).strict();

export type UserProgress = z.infer<typeof userProgressSchema>;
export type SavedBotGame = UserProgress["gameHistory"][number];
