const express = require('express');
const prisma = require('../config/database');
const router = express.Router();

router.get('/global', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 1000 } },
    orderBy: { totalPoints: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      pictureUrl: true,
      totalPoints: true,
      scores: { select: { _count: true }, orderBy: { completedAt: 'desc' }, take: 1 },
      _count: { select: { scores: true } },
    },
  });

  const leaderboard = users.map(u => ({
    user: { id: u.id, name: u.name, pictureUrl: u.pictureUrl },
    totalPoints: u.totalPoints,
    quizzesPlayed: u._count.scores,
  }));

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
