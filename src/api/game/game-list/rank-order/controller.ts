// FILE LOCATION: src/api/game/game-list/rank-order/controller.ts
// PURPOSE: Business logic and request handlers for Rank Order game

import { Request, Response } from 'express';
import { CreateRankOrderSchema, SubmitRankOrderSchema } from './validation';
import {
  RankOrderGameData,
  RankOrderGameplay,
  RankOrderResult,
  RankOrderSubmission,
} from '../../../../common/interface/games/rank-order.interface';

export class RankOrderController {
  // Validate game data when creating
  static validateCreate(req: Request, res: Response) {
    try {
      const validated = CreateRankOrderSchema.parse(req.body);
      return res.status(200).json({
        success: true,
        message: 'Rank Order game data is valid',
        data: validated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors || error.message,
      });
    }
  }

  // Transform game data for gameplay (hide correct answers)
  static getGameplay(gameData: RankOrderGameData): RankOrderGameplay {
    const shuffledItems = [...gameData.items]
      .map(({ correctOrder, ...item }) => item)
      .sort(() => Math.random() - 0.5); // Shuffle items

    return {
      items: shuffledItems,
      timeLimit: gameData.timeLimit,
    };
  }

  // Calculate score and check answers
  static checkAnswers(
    gameData: RankOrderGameData,
    submission: RankOrderSubmission
  ): RankOrderResult {
    const { orderedItems } = submission;
    const correctOrder = [...gameData.items].sort(
      (a, b) => a.correctOrder - b.correctOrder
    );

    let correctCount = 0;
    let score = 0;

    // Check each position
    for (let i = 0; i < Math.min(orderedItems.length, correctOrder.length); i++) {
      if (orderedItems[i] === correctOrder[i].id) {
        correctCount++;
      }
    }

    // Calculate score (percentage)
    const maxScore = gameData.items.length;
    score = correctCount;

    // Bonus for speed if time limit exists
    if (gameData.timeLimit && submission.timeTaken) {
      const timeBonus = Math.max(
        0,
        Math.floor((gameData.timeLimit - submission.timeTaken) / 10)
      );
      score += timeBonus;
    }

    return {
      score,
      maxScore,
      correctOrder,
      userOrder: orderedItems,
      isCorrect: correctCount === maxScore,
      correctCount,
    };
  }

  // Submit answer endpoint
  static submitAnswer(req: Request, res: Response) {
    try {
      const submission = SubmitRankOrderSchema.parse(req.body);
      
      // In real implementation, get gameData from database using gameId
      // const gameId = req.params.gameId;
      // const gameData = await prisma.game.findUnique({ where: { id: gameId } });
      
      // For demonstration, return validation success
      return res.status(200).json({
        success: true,
        message: 'Answer submitted successfully',
        data: submission,
      });
    } catch (error: any) {
      console.error('Submit answer error:', error);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors || error.message,
      });
    }
  }

  // Get game by ID (example endpoint)
  static async getGameById(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      
      // Mock data for testing
      // In production, fetch from database:
      // const game = await prisma.game.findUnique({ where: { id: gameId } });
      
      const mockGame: RankOrderGameData = {
        title: 'Sort Life Cycle of Flowering Plant',
        description: 'Arrange the stages in correct order',
        items: [
          { id: '1', content: 'Seed Production', correctOrder: 1 },
          { id: '2', content: 'Germination', correctOrder: 2 },
          { id: '3', content: 'Growth', correctOrder: 3 },
          { id: '4', content: 'Flower Production', correctOrder: 4 },
          { id: '5', content: 'Pollination', correctOrder: 5 },
          { id: '6', content: 'Fertilisation', correctOrder: 6 },
          { id: '7', content: 'Seed Dispersal', correctOrder: 7 },
        ],
        timeLimit: 120,
        showImages: false,
      };

      return res.status(200).json({
        success: true,
        message: 'Game retrieved successfully',
        data: mockGame,
      });
    } catch (error: any) {
      console.error('Get game error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve game',
        errors: error.message,
      });
    }
  }
}