const express = require('express');
const prisma = require('../config/database');
const { optionalAuthenticate } = require('../middleware/auth');

// Level logic (mirrors frontend utils/levels.js)
const TIERS = [
  { name: 'Amateur',     min: 1000, max: 1499 },
  { name: 'Expert',      min: 1500, max: 1999 },
  { name: 'Master',      min: 2000, max: 2499 },
  { name: 'Grandmaster', min: 2500, max: Infinity },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const toRoman = (n) => ROMAN[n - 1] || String(n);

function getLevel(totalPoints) {
  const SUBLEVEL_SIZE = 100;
  const tier = TIERS.find(t => totalPoints >= t.min && totalPoints <= t.max);
  if (!tier) {
    const band = Math.floor((totalPoints - 2500) / 500);
    const bandMin = 2500 + band * 500;
    const offset = totalPoints - bandMin;
    const subLevel = Math.min(5, Math.floor(offset / SUBLEVEL_SIZE) + 1);
    return { tierName: 'Grandmaster', subLevel, label: `Grandmaster ${toRoman(subLevel)}`, progressInSub: offset % SUBLEVEL_SIZE };
  }
  const offset = totalPoints - tier.min;
  const subLevel = Math.min(5, Math.floor(offset / SUBLEVEL_SIZE) + 1);
  return { tierName: tier.name, subLevel, label: `${tier.name} ${toRoman(subLevel)}`, progressInSub: offset % SUBLEVEL_SIZE };
}

function scoreQuiz(correctCount, total) {
  let earned = correctCount * 5;
  if (correctCount === total) earned += 50;
  return earned;
}

const router = express.Router();

router.get('/stats', async (req, res) => {
  const totalPlays = await prisma.quizPlay.count();
  res.json({ totalPlays });
});

router.get('/', async (req, res) => {
  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      tag: true,
      difficulty: true,
    },
  });

  res.json({ quizzes });
});

router.get('/:id', async (req, res) => {
  const quizId = Number(req.params.id);
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: true },
      },
    },
  });

  if (!quiz || !quiz.isPublished) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  res.json({ quiz });
});

router.post('/:id/submit', optionalAuthenticate, async (req, res) => {
  const quizId = Number(req.params.id);
  const answers = req.body.answers || [];

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { options: true },
      },
    },
  });

  if (!quiz || !quiz.isPublished) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  const questions = quiz.questions;
  let correctCount = 0;
  const details = questions.map((question) => {
    const selected = answers.find((item) => item.questionId === question.id);
    const selectedOptionId = selected ? selected.optionId : null;
    const correctOptions = question.options.filter((option) => option.isCorrect);
    const isCorrect = correctOptions.some((option) => option.id === selectedOptionId);

    if (isCorrect) correctCount += 1;

    return {
      questionId: question.id,
      selectedOptionId,
      correctOptionIds: correctOptions.map((option) => option.id),
      isCorrect,
    };
  });

  const scoreData = {
    quizId,
    score: correctCount,
  };

  let pointsEarned = 0;
  let levelBefore = null;
  let levelAfter = null;
  let newTotalPoints = null;

  if (req.user?.userId && req.user.userId > 0) {
    scoreData.userId = req.user.userId;
    await prisma.score.upsert({
      where: { userId_quizId: { userId: req.user.userId, quizId } },
      update: { score: correctCount, completedAt: new Date() },
      create: { userId: req.user.userId, quizId, score: correctCount },
    });

    await prisma.userResponse.createMany({
      data: details.map((detail) => ({
        userId: req.user.userId,
        quizId,
        questionId: detail.questionId,
        selectedOptionId: detail.selectedOptionId,
        isCorrect: detail.isCorrect,
      })),
      skipDuplicates: true,
    });

    // Award points
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { totalPoints: true } });
    pointsEarned = scoreQuiz(correctCount, questions.length);
    levelBefore = getLevel(user.totalPoints);
    newTotalPoints = user.totalPoints + pointsEarned;
    levelAfter = getLevel(newTotalPoints);
    await prisma.user.update({ where: { id: req.user.userId }, data: { totalPoints: newTotalPoints } });
  }

  res.json({
    score: correctCount,
    total: questions.length,
    details,
    pointsEarned,
    totalPoints: newTotalPoints,
    levelBefore,
    levelAfter,
  });
});

router.post('/:id/play', optionalAuthenticate, async (req, res) => {
  const quizId = Number(req.params.id);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, title: true, tag: true, isPublished: true },
  });

  if (!quiz || !quiz.isPublished) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  // Get client IP (support proxies)
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    null;

  // Skip geolocation for localhost
  let country = null, city = null, region = null;
  const isLocalhost = !ip || ip === '::1' || ip === '127.0.0.1';

  if (!isLocalhost) {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,status`);
      const geoData = await geoRes.json();
      if (geoData.status === 'success') {
        country = geoData.country || null;
        city = geoData.city || null;
        region = geoData.regionName || null;
      }
    } catch (err) {
      console.error('Geolocation lookup failed:', err.message);
    }
  }

  await prisma.quizPlay.create({
    data: {
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizTag: quiz.tag || null,
      userId: req.user?.userId || null,
      ipAddress: isLocalhost ? 'localhost' : ip,
      country,
      city,
      region,
    },
  });

  res.status(201).json({ message: 'Play recorded' });
});

module.exports = router;
