import { type Prisma } from '@prisma/client';
import { type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '../../../../common';
import {
  type RankOrderGameData,
  type RankOrderGameplay,
  type RankOrderResult,
  type RankOrderSubmission,
} from '../../../../common/interface/games/rank-order.interface';
import { CreateRankOrderSchema, SubmitRankOrderSchema } from './validation';

export class RankOrderController {
  static validateCreate(request: Request, response: Response) {
    try {
      const validated = CreateRankOrderSchema.parse(request.body);

      return response.status(200).json({
        success: true,
        message: 'Rank Order game data is valid',
        data: validated,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      return response.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: message,
      });
    }
  }

  static getGameplay(gameData: RankOrderGameData): RankOrderGameplay {
    const shuffledItems = [...gameData.items]
      .map(item => {
        const copy = { ...item } as Record<string, unknown>;
        delete copy.correctOrder;

        return copy as unknown as typeof item;
      })
      .sort(() => Math.random() - 0.5);

    return {
      items: shuffledItems,
      timeLimit: gameData.timeLimit,
    };
  }

  static checkAnswers(
    gameData: RankOrderGameData,
    submission: RankOrderSubmission,
  ): RankOrderResult {
    const { orderedItems } = submission;
    
    const correctOrderIds = [...gameData.items]
      .sort((a, b) => a.correctOrder - b.correctOrder)
      .map(item => item.id);

    let correctCount = 0;

    for (
      let index = 0;
      index < Math.min(orderedItems.length, correctOrderIds.length);
      index++
    ) {
      if (orderedItems[index] === correctOrderIds[index]) {
        correctCount++;
      }
    }

    const maxScoreBase = gameData.items.length * 100;
    const maxTimeBonus = gameData.timeLimit ? gameData.timeLimit * 10 : 0;
    const isAllCorrect = correctCount === gameData.items.length;

    let score = correctCount * 100;

    if (isAllCorrect && gameData.timeLimit && submission.timeTaken) {
      const timeRemaining = Math.max(0, gameData.timeLimit - submission.timeTaken);
      const timeBonus = Math.floor(timeRemaining * 10);
      score += timeBonus;
    }

    return {
      score,
      maxScore: maxScoreBase + maxTimeBonus,
      correctOrder: gameData.items,
      userOrder: orderedItems,
      isCorrect: isAllCorrect,
      correctCount,
    };
  }

  static async submitAnswer(request: Request, response: Response) {
    try {
      const submission = SubmitRankOrderSchema.parse(request.body);

      const game = await prisma.games.findUnique({
        where: { id: submission.gameId },
      });

      if (!game) {
        return response.status(404).json({
          success: false,
          message: 'Game not found',
        });
      }

      const gameData = game.game_json as unknown as RankOrderGameData;
      const result = RankOrderController.checkAnswers(gameData, submission);

      return response.status(200).json({
        success: true,
        message: 'Answer submitted successfully',
        data: result,
      });
    } catch (error: unknown) {
      console.error('Submit answer error:', error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      return response.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: message,
      });
    }
  }

  static async getGameById(request: Request<{ gameId: string }>, response: Response) {
    try {
      const { gameId } = request.params;

      if (!gameId) {
        return response
          .status(400)
          .json({ success: false, message: 'Game ID required' });
      }

      const game = await prisma.games.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          name: true,
          description: true,
          game_json: true,
          thumbnail_image: true,
          game_template: { select: { slug: true } },
          is_published: true,
        },
      });

      if (!game || game.game_template.slug !== 'rank-order') {
        return response
          .status(404)
          .json({ success: false, message: 'Game not found' });
      }

      const gameJson = game.game_json as unknown as RankOrderGameData | null;

      if (!gameJson) {
        return response
          .status(404)
          .json({ success: false, message: 'Game data not found' });
      }

      const responseData: RankOrderGameData = {
        title: gameJson.title ?? game.name,
        description: (gameJson.description ?? game.description) as string,
        items: gameJson.items ?? [],
        timeLimit: gameJson.timeLimit,
        showImages: gameJson.showImages ?? false,
      };

      return response.status(200).json({
        success: true,
        message: 'Game retrieved successfully',
        data: responseData,
      });
    } catch (error: unknown) {
      console.error('Get game error:', error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve game',
        errors: message,
      });
    }
  }

  static async create(request: Request, response: Response) {
    try {
      const validated = CreateRankOrderSchema.parse(
        request.body,
      ) as RankOrderGameData;

      const anyRequest = request as unknown as { user?: { user_id?: string } };
      const creatorId = anyRequest.user?.user_id;

      if (!creatorId) {
        return response
          .status(401)
          .json({ success: false, message: 'Authentication required' });
      }

      const template = await prisma.gameTemplates.findUnique({
        where: { slug: 'rank-order' },
      });
      if (!template)
        throw new ErrorResponse(
          StatusCodes.NOT_FOUND,
          'Game template not found',
        );
      
      const body = request.body as { thumbnail_image?: string };

      const created = await prisma.games.create({
        data: {
          name: validated.title,
          description: validated.description || undefined,
          thumbnail_image: body.thumbnail_image || '',
          game_template_id: template.id,
          creator_id: creatorId,
          is_published: false,
          game_json: validated as unknown as Prisma.InputJsonValue,
        },
        select: { id: true, name: true },
      });

      return response
        .status(201)
        .json({ success: true, message: 'Game created', data: created });
    } catch (error: unknown) {
      console.error('Create game error:', error);

      if (error instanceof ErrorResponse) {
        return response
          .status(error.code)
          .json({ success: false, message: error.message });
      }

      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      return response
        .status(400)
        .json({ success: false, message: message || 'Failed to create game' });
    }
  }

  static async update(request: Request, response: Response) {
    try {
      const { gameId } = request.params;
      
      const { 
        title, 
        description, 
        items, 
        timeLimit, 
        showImages, 
        thumbnail_image 
      } = request.body;

      if (!title || !items) {
         return response.status(400).json({ 
           success: false, 
           message: 'Title and items are required' 
         });
      }

      const newGameJson = {
        title,
        description,
        items,
        timeLimit: timeLimit || 120,
        showImages: showImages ?? true,
      };

      const updatedGame = await prisma.games.update({
        where: { id: gameId },
        data: {
          name: title,
          description: description,
          ...(thumbnail_image && { thumbnail_image }),
          game_json: newGameJson as Prisma.InputJsonValue,
        },
      });

      return response.status(200).json({
        success: true,
        message: 'Game updated successfully',
        data: updatedGame,
      });

    } catch (error: unknown) {
      console.error('Update game error:', error);
      
      if ((error as any).code === 'P2025') {
         return response.status(404).json({
           success: false,
           message: 'Game not found',
         });
      }

      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      return response.status(500).json({
        success: false,
        message: 'Failed to update game',
        errors: message,
      });
    }
  }
}