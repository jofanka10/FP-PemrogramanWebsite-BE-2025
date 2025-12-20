import { prisma } from '@/common';
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';
import { AdditionalValidation } from '@/utils';

import { GameService } from './game.service';
import { gameListRouter } from './game-list/game-list.router';
import {
  GamePaginateQuerySchema,
  GameTemplateQuerySchema,
  type IUpdateLikeCount,
  type IUpdatePlayCount,
  type IUpdatePublishStatus,
  UpdateLikeCountSchema,
  UpdatePlayCountSchema,
  UpdatePublishStatusSchema,
} from './schema';

// ========== SETUP MULTER UNTUK UPLOAD ==========
const uploadPath = path.join(process.cwd(), 'uploads'); // Gunakan process.cwd() biar aman
mkdir(uploadPath, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});
// ========== END SETUP MULTER ==========

export const GameController = Router()
  .get(
    '/',
    validateAuth({ optional: true }),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const query = AdditionalValidation.validate(
          GamePaginateQuerySchema,
          request.query,
        );

        const games = await GameService.getAllGame(
          query,
          false,
          undefined,
          request.user?.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get all game successfully',
          games.data,
          games.meta,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // ========== ENDPOINT UPLOAD FILE (BARU) ==========
  .post(
    '/upload',
    validateAuth({}),
    upload.single('file'),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        if (!request.file) {
          throw new Error('No file uploaded');
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
        // Pastikan route static uploads sudah di-setup di main.ts, jika belum URL ini mungkin 404
        const fileUrl = `${baseUrl}/uploads/${request.file.filename}`;

        const result = new SuccessResponse(StatusCodes.OK, 'File uploaded successfully', {
          url: fileUrl,
          filename: request.file.filename,
          size: request.file.size,
        });

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // ========== ENDPOINT CREATE GAME UTAMA ==========
  .post(
    '/',
    validateAuth({}),
    async (
      request: AuthedRequest,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const { name, description, thumbnail_image, game_template_id, is_publish, game_json } = request.body;

        // Validasi game template exists
        const template = await prisma.gameTemplates.findUnique({
          where: { id: game_template_id },
        });

        if (!template) {
          throw new Error('Game template not found');
        }

        // Create game
        const game = await prisma.games.create({
          data: {
            name,
            description,
            thumbnail_image,
            game_template_id,
            creator_id: request.user!.user_id,
            is_published: is_publish || false,
            game_json: game_json,
          },
          include: {
            game_template: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        });

        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Game created successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // ========== ENDPOINT LAINNYA ==========
  .patch(
    '/',
    validateAuth({}),
    validateBody({
      schema: UpdatePublishStatusSchema,
    }),
    async (
      request: AuthedRequest<{}, {}, IUpdatePublishStatus>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedStatus = await GameService.updateGamePublishStatus(
          request.body,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game publish status updated successfully',
          updatedStatus,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/private',
    validateAuth({
      allowed_roles: ['SUPER_ADMIN'],
    }),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const query = AdditionalValidation.validate(
          GamePaginateQuerySchema,
          request.query,
        );

        const games = await GameService.getAllGame(
          query,
          true,
          undefined,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get all game (private) successfully',
          games.data,
          games.meta,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/user/:user_id',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest, // FIX: Hapus Generic
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const query = AdditionalValidation.validate(
          GamePaginateQuerySchema,
          request.query,
        );

        const games = await GameService.getAllGame(
          query,
          false,
          request.params.user_id,
          request.user?.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get all user game successfully',
          games.data,
          games.meta,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/template',
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const query = AdditionalValidation.validate(
          GameTemplateQuerySchema,
          request.query,
        );
        const templates = await GameService.getAllGameTemplate(query);
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get all game template successfully',
          templates,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:id',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest, // FIX: Hapus Generic
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await GameService.getGameById(
          request.params.id,
          request.user?.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get game by id successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/play-count',
    validateAuth({
      optional: true,
    }),
    validateBody({
      schema: UpdatePlayCountSchema,
    }),
    async (
      request: AuthedRequest,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const body = request.body as IUpdatePlayCount;
        await GameService.updateGamePlayCount(
          body.game_id,
          request.user?.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game play count updated successfully',
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/like',
    validateAuth({}),
    validateBody({
      schema: UpdateLikeCountSchema,
    }),
    async (
      request: AuthedRequest,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const body = request.body as IUpdateLikeCount;
        await GameService.updateGameLikeCount(
          body.game_id,
          request.user!.user_id,
          body.is_like,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'User liked game update successfully',
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .use('/game-type', gameListRouter);