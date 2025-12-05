// FILE LOCATION: src/api/game/game-list/rank-order/validation.ts
// PURPOSE: Zod validation schemas for Rank Order game

import { z } from 'zod';

const RankOrderItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  correctOrder: z.number().int().positive('Order must be positive'),
});

export const CreateRankOrderSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  items: z
    .array(RankOrderItemSchema)
    .min(2, 'At least 2 items are required')
    .max(20, 'Maximum 20 items allowed')
    .refine(
      (items) => {
        const orders = items.map((item) => item.correctOrder);
        const uniqueOrders = new Set(orders);
        return uniqueOrders.size === orders.length;
      },
      { message: 'Each item must have a unique order number' }
    )
    .refine(
      (items) => {
        const orders = items.map((item) => item.correctOrder).sort((a, b) => a - b);
        for (let i = 0; i < orders.length; i++) {
          if (orders[i] !== i + 1) return false;
        }
        return true;
      },
      { message: 'Order numbers must be sequential starting from 1' }
    ),
  timeLimit: z.number().int().positive().optional(),
  showImages: z.boolean().default(false),
});

export const SubmitRankOrderSchema = z.object({
  orderedItems: z.array(z.string()).min(1, 'At least one item is required'),
  timeTaken: z.number().int().nonnegative().optional(),
});

export type CreateRankOrderInput = z.infer<typeof CreateRankOrderSchema>;
export type SubmitRankOrderInput = z.infer<typeof SubmitRankOrderSchema>;