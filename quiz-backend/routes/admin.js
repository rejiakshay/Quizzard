const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorizeAdmin);

router.get('/quizzes', async (req, res) => {
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: {
        include: { options: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ quizzes });
});

router.get('/quizzes/:id', async (req, res) => {
  const quizId = Number(req.params.id);
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  res.json({ quiz });
});

router.post('/quizzes', async (req, res) => {
  const { title, description, tag, difficulty, isPublished, questions = [] } = req.body;

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      tag,
      difficulty: difficulty || null,
      isPublished: Boolean(isPublished),
      createdBy: req.user.userId > 0 ? req.user.userId : undefined,
      questions: {
        create: questions.map((question) => ({
          questionText: question.questionText,
          type: question.type || 'multiple_choice',
          order: question.order || 0,
          funFact: question.funFact || undefined,
          options: {
            create: question.options.map((option) => ({
              text: option.text,
              isCorrect: Boolean(option.isCorrect),
            })),
          },
        })),
      },
    },
    include: { questions: { include: { options: true } } },
  });

  res.status(201).json({ quiz });
});

router.patch('/quizzes/:id', async (req, res) => {
  const quizId = Number(req.params.id);
  const { title, description, tag, difficulty, isPublished } = req.body;

  const quiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      title,
      description,
      tag,
      difficulty: typeof difficulty === 'string' ? difficulty : undefined,
      isPublished: typeof isPublished === 'boolean' ? isPublished : undefined,
    },
    include: { questions: true },
  });

  res.json({ quiz });
});

router.delete('/quizzes/:id', async (req, res) => {
  const quizId = Number(req.params.id);

  await prisma.quizPlay.deleteMany({ where: { quizId } });
  await prisma.userResponse.deleteMany({ where: { quizId } });
  await prisma.score.deleteMany({ where: { quizId } });
  await prisma.option.deleteMany({ where: { question: { quizId } } });
  await prisma.question.deleteMany({ where: { quizId } });
  await prisma.quiz.delete({ where: { id: quizId } });

  res.status(204).send();
});

router.post('/quizzes/:id/questions', async (req, res) => {
  const quizId = Number(req.params.id);
  const { questionText, type, order, funFact, options = [] } = req.body;

  const question = await prisma.question.create({
    data: {
      quizId,
      questionText,
      type: type || 'multiple_choice',
      order: order || 0,
      funFact: funFact || undefined,
      options: {
        create: options.map((option) => ({
          text: option.text,
          isCorrect: Boolean(option.isCorrect),
        })),
      },
    },
    include: { options: true },
  });

  res.status(201).json({ question });
});

router.put('/quizzes/:quizId/questions/:questionId', async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { questionText, type, order, funFact, options = [] } = req.body;

  await prisma.option.deleteMany({ where: { questionId } });
  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      questionText,
      type: type || 'multiple_choice',
      order: order || 0,
      funFact: typeof funFact === 'string' ? funFact : undefined,
      options: {
        create: options.map((option) => ({
          text: option.text,
          isCorrect: Boolean(option.isCorrect),
        })),
      },
    },
    include: { options: true },
  });

  res.json({ question });
});

router.delete('/quizzes/:quizId/questions/:questionId', async (req, res) => {
  const questionId = Number(req.params.questionId);
  await prisma.option.deleteMany({ where: { questionId } });
  await prisma.question.delete({ where: { id: questionId } });
  res.status(204).send();
});

router.post('/quizzes/:id/publish', async (req, res) => {
  const quizId = Number(req.params.id);
  const { isPublished } = req.body;

  const quiz = await prisma.quiz.update({
    where: { id: quizId },
    data: { isPublished: Boolean(isPublished) },
  });

  res.json({ quiz });
});

module.exports = router;
