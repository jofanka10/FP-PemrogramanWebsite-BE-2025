import { Router } from 'express';
import { validateAuth } from '@/common'; 
import { RankOrderController } from './controller';

const router = Router();

router.post('/validate', (request, response) =>
  RankOrderController.validateCreate(request, response),
);

router.post('/create', validateAuth({}), (request, response) =>
  RankOrderController.create(request, response),
);

router.post('/submit', validateAuth({}), (request, response) =>
  RankOrderController.submitAnswer(request, response),
);

router.get('/:gameId', validateAuth({}), (request, response) =>
  RankOrderController.getGameById(request, response),
);

router.patch('/:gameId', validateAuth({}), (request, response) =>
  RankOrderController.update(request, response),
);

export default router;