import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { COINS_PER_QUIZ } from '../constants.js';
import { checkAndAwardBadges } from '../utils/badges.js';

export const getQuizForProblem = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).lean();
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const questions = await Quiz.find({ problemId: problem._id }).sort({ order: 1 }).lean();
    const attempts = await QuizAttempt.find({ userId: req.user._id, problemId: problem._id }).lean();
    const attemptedMap = Object.fromEntries(attempts.map((a) => [a.quizId.toString(), a.correct]));

    res.json({
      success: true,
      questions: questions.map((q) => ({
        id: q._id,
        question: q.question,
        options: q.options,
        order: q.order,
        attempted: attemptedMap[q._id.toString()] !== undefined,
        wasCorrect: attemptedMap[q._id.toString()] || false,
      })),
      totalQuestions: questions.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitQuizAnswer = async (req, res) => {
  try {
    const { quizId, selectedIndex } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Question not found' });

    const existing = await QuizAttempt.findOne({ userId: req.user._id, quizId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already answered this question' });
    }

    const correct = selectedIndex === quiz.correctIndex;
    let coinsEarned = 0;
    if (correct) {
      coinsEarned = COINS_PER_QUIZ;
      await User.findByIdAndUpdate(req.user._id, { $inc: { coins: COINS_PER_QUIZ } });
      await checkAndAwardBadges(req.user._id);
    }

    await QuizAttempt.create({
      userId: req.user._id,
      quizId,
      problemId: quiz.problemId,
      correct,
      coinsEarned,
    });

    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      correct,
      correctIndex: quiz.correctIndex,
      coinsEarned,
      coins: user.coins,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
