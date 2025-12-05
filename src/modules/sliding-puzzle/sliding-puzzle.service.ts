import { PrismaClient } from '@prisma/client';
import { ISubmitScore } from './sliding-puzzle.validation.js';

const prisma = new PrismaClient();

export class SlidingPuzzleService {
  static async getAllPuzzles() {
    return await prisma.slidingPuzzle.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPuzzleById(id: string) {
    const puzzle = await prisma.slidingPuzzle.findUnique({
      where: { id },
    });

    if (!puzzle) {
      throw new Error('Puzzle not found');
    }

    return puzzle;
  }

  static async submitScore(puzzleId: string, data: ISubmitScore) {
    const puzzle = await prisma.slidingPuzzle.findUnique({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      throw new Error('Puzzle not found');
    }

    return await prisma.slidingPuzzleScore.create({
      data: {
        puzzleId,
        playerName: data.playerName,
        moves: data.moves,
        timeSpent: data.timeSpent,
        completed: data.completed,
      },
    });
  }

  static async getLeaderboard(puzzleId: string, limit: number = 10) {
    return await prisma.slidingPuzzleScore.findMany({
      where: { puzzleId, completed: true },
      orderBy: [{ moves: 'asc' }, { timeSpent: 'asc' }],
      take: limit,
    });
  }
}