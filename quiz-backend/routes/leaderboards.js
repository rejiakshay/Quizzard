const express = require('express');
const prisma = require('../config/database');
const router = express.Router();

router.get('/global', async (req, res) => {
  const leaderboard = await prisma.score.findMany({
    orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
    take: 20,
    select: {
      score: true,
      completedAt: true,
      quizId: true,
      user: {
        select: { id: true, name: true, pictureUrl: true },
      },
    },
  });

  res.json({ leaderboard });
});

router.get('/:quizId', async (req, res) => {
  const quizId = Number(req.params.quizId);
  const leaderboard = await prisma.score.findMany({
    where: { quizId },
    orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
    take: 20,
    select: {
      score: true,
      completedAt: true,
      user: {
        select: { id: true, name: true, pictureUrl: true },
      },
    },
  });

  res.json({ leaderboard });
});

module.exports = router;
