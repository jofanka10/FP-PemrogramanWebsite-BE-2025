// FILE LOCATION: src/api/game/game-list/rank-order/index.ts
// PURPOSE: API routes for Rank Order game

import { Router } from 'express';
import { RankOrderController } from './controller';

const router = Router();

// POST /api/game/rank-order/validate
// Validate game creation data
router.post('/validate', RankOrderController.validateCreate);

// POST /api/game/rank-order/submit
// Submit answer and get score
router.post('/submit', RankOrderController.submitAnswer);

// GET /api/game/rank-order/:gameId
// Get game data by ID (for testing)
router.get('/:gameId', RankOrderController.getGameById);

export default router;