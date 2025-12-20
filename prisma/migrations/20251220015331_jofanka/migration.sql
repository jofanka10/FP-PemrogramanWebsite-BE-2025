/*
  Warnings:

  - You are about to drop the `sliding_puzzle_scores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sliding_puzzles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sliding_puzzle_scores" DROP CONSTRAINT "sliding_puzzle_scores_puzzleId_fkey";

-- DropTable
DROP TABLE "sliding_puzzle_scores";

-- DropTable
DROP TABLE "sliding_puzzles";
