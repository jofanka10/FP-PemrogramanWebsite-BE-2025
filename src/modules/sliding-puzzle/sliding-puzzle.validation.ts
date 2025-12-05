import { z } from 'zod';

export const SubmitScoreSchema = z.object({
  playerName: z.string().min(1).max(50),
  moves: z.number().int().positive(),
  timeSpent: z.number().int().positive(),
  completed: z.boolean().default(true),
});

export type ISubmitScore = z.infer<typeof SubmitScoreSchema>;