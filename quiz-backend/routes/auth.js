const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    const user = await prisma.user.upsert({
      where: { googleId: sub },
      update: {
        email,
        name,
        pictureUrl: picture,
      },
      create: {
        googleId: sub,
        email,
        name,
        pictureUrl: picture,
      },
    });

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, pictureUrl: user.pictureUrl, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        pictureUrl: user.pictureUrl,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const jwtToken = jwt.sign(
    {
      userId: 0,
      email: 'admin@local',
      name: 'Admin',
      pictureUrl: null,
      isAdmin: true,
      username,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token: jwtToken,
    user: {
      id: 0,
      email: 'admin@local',
      name: 'Admin',
      pictureUrl: null,
      isAdmin: true,
    },
  });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered. Please sign in.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const jwtToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, pictureUrl: user.pictureUrl, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token: jwtToken,
    user: { id: user.id, name: user.name, email: user.email, pictureUrl: user.pictureUrl, isAdmin: user.isAdmin, totalPoints: user.totalPoints },
  });
});

router.post('/email-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const jwtToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, pictureUrl: user.pictureUrl, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token: jwtToken,
    user: { id: user.id, name: user.name, email: user.email, pictureUrl: user.pictureUrl, isAdmin: user.isAdmin, totalPoints: user.totalPoints },
  });
});

router.get('/user', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, name: true, pictureUrl: true, isAdmin: true, totalPoints: true },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user });
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user, scores, responses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, pictureUrl: true, bio: true, totalPoints: true, createdAt: true },
      }),
      prisma.score.findMany({
        where: { userId },
        include: { quiz: { select: { title: true, tag: true, questions: { select: { id: true } } } } },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.userResponse.findMany({
        where: { userId },
        select: { isCorrect: true, quiz: { select: { tag: true } } },
      }),
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalQuizzes = scores.length;
    const totalCorrect = responses.filter(r => r.isCorrect).length;
    const totalAnswered = responses.length;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // Category breakdown
    const catMap = {};
    for (const r of responses) {
      const tag = r.quiz?.tag || 'General';
      if (!catMap[tag]) catMap[tag] = { correct: 0, total: 0 };
      catMap[tag].total += 1;
      if (r.isCorrect) catMap[tag].correct += 1;
    }
    const categories = Object.entries(catMap)
      .map(([tag, { correct, total }]) => ({ tag, correct, total, accuracy: Math.round((correct / total) * 100) }))
      .sort((a, b) => b.accuracy - a.accuracy);

    // Recent scores
    const recentScores = scores.slice(0, 10).map(s => ({
      quizId: s.quizId,
      title: s.quiz.title,
      tag: s.quiz.tag,
      score: s.score,
      total: s.quiz.questions.length,
      completedAt: s.completedAt,
    }));

    res.json({ user, stats: { totalQuizzes, totalCorrect, totalAnswered, accuracy }, categories, recentScores });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { bio: bio?.slice(0, 300) ?? undefined },
      select: { id: true, name: true, email: true, pictureUrl: true, bio: true, totalPoints: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { rating, message, name, email } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const userId = req.headers.authorization
      ? (() => { try { const t = req.headers.authorization.split(' ')[1]; const d = require('jsonwebtoken').verify(t, process.env.JWT_SECRET); return d.userId > 0 ? d.userId : null; } catch { return null; } })()
      : null;

    await prisma.feedback.create({
      data: { userId, name: name?.trim() || null, email: email?.trim() || null, rating: rating ? Number(rating) : null, message: message.trim() },
    });
    res.status(201).json({ message: 'Feedback submitted. Thank you!' });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

module.exports = router;
