/* eslint-disable unicorn/prefer-module */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

import { appRouter } from './api/router';
import { ErrorHandler } from './common';
import slidingPuzzleRoutes from './modules/sliding-puzzle/sliding-puzzle.route.js';

// Load environment variables
const envResult = dotenv.config({ quiet: true });

// Expand ${VAR} patterns in environment values so .env files that reference
// other variables (e.g. DATABASE_URL using POSTGRES_USER) work without
// requiring an external dotenv-expand dependency.
if (envResult.parsed) {
  // iterate over loaded keys and expand any ${VAR} in their values
  const parsed = envResult.parsed as Record<string, string> | undefined;

  for (const [key, value] of Object.entries(parsed ?? {})) {
    if (typeof value === 'string' && value.includes('${')) {
      // replace ${VAR} occurrences with process.env[VAR] (loaded by dotenv)
      process.env[key] = value.replaceAll(
        /\${([^}]+)}/g,
        (_m: string, name: string) => process.env[name] ?? '',
      );
    } else if (value !== undefined) {
      process.env[key] = value;
    }
  }
}

const uploadPath = path.join(__dirname, '..', 'uploads');
mkdir(uploadPath, { recursive: true });

const app = express();

// --- BAGIAN PERBAIKAN CORS ---
app.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // Kita ubah '*' menjadi list spesifik agar header Authorization diterima browser
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);
// -----------------------------

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/sliding-puzzle', slidingPuzzleRoutes);
app.use('/health', (_, response) =>
  response.status(200).json({
    success: true,
    statusCode: StatusCodes.OK,
    message: `🌟 Server is healthy. Current time is ${new Date(Date.now()).toLocaleString('ID-id')}`,
  }),
);

app.use('/uploads', express.static(uploadPath));

app.use('/api', appRouter);
app.use(ErrorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on Port ${port} 💫`);
});