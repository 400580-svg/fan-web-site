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
  recentlyViewed: z.array(id).max(5)
}).strict();

export type UserProgress = z.infer<typeof userProgressSchema>;
