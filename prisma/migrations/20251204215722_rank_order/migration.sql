-- CreateTable
CREATE TABLE "sliding_puzzles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "gridSize" INTEGER NOT NULL DEFAULT 3,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sliding_puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sliding_puzzle_scores" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "moves" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sliding_puzzle_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sliding_puzzle_scores_puzzleId_timeSpent_idx" ON "sliding_puzzle_scores"("puzzleId", "timeSpent");

-- AddForeignKey
ALTER TABLE "sliding_puzzle_scores" ADD CONSTRAINT "sliding_puzzle_scores_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "sliding_puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
