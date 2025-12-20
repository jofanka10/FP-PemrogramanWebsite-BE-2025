/* eslint-disable @typescript-eslint/naming-convention */
// FILE LOCATION: src/common/interface/games/rank-order.interface.ts
// PURPOSE: TypeScript interfaces for Rank Order game data structures

export interface RankOrderItem {
  id: string;
  content: string;
  imageUrl?: string;
  correctOrder: number; // 1, 2, 3, etc.
}

export interface RankOrderGameData {
  title: string;
  description?: string;
  items: RankOrderItem[];
  timeLimit?: number; // in seconds, optional
  showImages: boolean;
}

export interface RankOrderGameplay {
  items: Omit<RankOrderItem, 'correctOrder'>[]; // Hide correct order during gameplay
  timeLimit?: number;
}

export interface RankOrderSubmission {
  orderedItems: string[]; // Array of item IDs in user's order
  timeTaken?: number; // in seconds
}

export interface RankOrderResult {
  score: number;
  maxScore: number;
  correctOrder: RankOrderItem[];
  userOrder: string[];
  isCorrect: boolean;
  correctCount: number;
}

// Response wrapper for API
/* eslint-disable @typescript-eslint/naming-convention */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}
