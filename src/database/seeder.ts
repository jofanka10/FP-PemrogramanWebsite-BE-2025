import slidingPuzzlesData from './data/sliding_puzzles.data.csv';

// Di dalam fungsi seed
console.log('Seeding sliding puzzles...');
for (const puzzle of slidingPuzzlesData) {
  await prisma.slidingPuzzle.upsert({
    where: { id: puzzle.id },
    update: {},
    create: {
      id: puzzle.id,
      title: puzzle.title,
      description: puzzle.description,
      imageUrl: puzzle.imageUrl,
      gridSize: parseInt(puzzle.gridSize),
      difficulty: puzzle.difficulty,
      category: puzzle.category,
      isActive: puzzle.isActive === 'true',
    },
  });
}