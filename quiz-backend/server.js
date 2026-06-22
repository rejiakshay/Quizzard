const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quizzes');
const adminRoutes = require('./routes/admin');
const leaderboardRoutes = require('./routes/leaderboards');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://quizzard.vercel.app',
    'https://quizzard-pearl.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboards', leaderboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Quiz backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
