const express = require('express');
const jwt = require('jsonwebtoken');
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

router.get('/user', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, name: true, pictureUrl: true, isAdmin: true },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user });
});

module.exports = router;
