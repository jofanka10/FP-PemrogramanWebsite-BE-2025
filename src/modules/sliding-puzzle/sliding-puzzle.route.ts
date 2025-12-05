import { Router } from 'express';
import { SlidingPuzzleController } from './sliding-puzzle.controller.js';

const router = Router();

router.get('/', SlidingPuzzleController.getAllPuzzles);
router.get('/:id', SlidingPuzzleController.getPuzzleById);
router.post('/:id/score', SlidingPuzzleController.submitScore);
router.get('/:id/leaderboard', SlidingPuzzleController.getLeaderboard);

export default router;