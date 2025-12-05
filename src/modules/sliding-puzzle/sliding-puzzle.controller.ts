import { Request, Response, NextFunction } from 'express';
import { SlidingPuzzleService } from './sliding-puzzle.service.js';
import { ISubmitScore } from './sliding-puzzle.validation.js';

export class SlidingPuzzleController {
  static async getAllPuzzles(req: Request, res: Response, next: NextFunction) {
    try {
      const puzzles = await SlidingPuzzleService.getAllPuzzles();
      res.json({ success: true, data: puzzles });
    } catch (error) {
      next(error);
    }
  }

  static async getPuzzleById(req: Request, res: Response, next: NextFunction) {
    try {
      const puzzle = await SlidingPuzzleService.getPuzzleById(req.params.id);
      res.json({ success: true, data: puzzle });
    } catch (error) {
      next(error);
    }
  }

  static async submitScore(
    req: Request<{ id: string }, {}, ISubmitScore>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const score = await SlidingPuzzleService.submitScore(req.params.id, req.body);
      res.json({ success: true, data: score });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await SlidingPuzzleService.getLeaderboard(req.params.id, limit);
      res.json({ success: true, data: leaderboard });
    } catch (error) {
      next(error);
    }
  }
}