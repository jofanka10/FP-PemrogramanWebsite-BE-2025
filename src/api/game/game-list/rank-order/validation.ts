import { z } from 'zod';

export const CreateRankOrderSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      content: z.string().min(1),
      imageUrl: z.string().optional().nullable(),
      correctOrder: z.number().int(),
    })
  ).min(2).max(10),
  timeLimit: z.number().min(10).max(600).optional(),
  showImages: z.boolean().optional(),
});

export const SubmitRankOrderSchema = z.object({
  gameId: z.string(),
  orderedItems: z.array(z.string()),
  timeTaken: z.number().optional(),
});