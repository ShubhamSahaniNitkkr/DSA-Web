import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import UserProgress from '../models/UserProgress.js';
import User from '../models/User.js';
import { recordSolve } from '../utils/activity.js';
import { checkAndAwardBadges } from '../utils/badges.js';
import { COINS_PER_PROBLEM } from '../constants.js';
import { buildSheetForUser } from '../services/sheetService.js';

export const getTopics = async (_req, res) => {
  try {
    const topics = await Topic.find().sort({ chapterOrder: 1 }).select('-__v').lean();
    res.set('Cache-Control', 'public, max-age=120');
    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTopicWithProblems = async (req, res) => {
  try {
    const { difficulty, company } = req.query;
    const topic = await Topic.findOne({ slug: req.params.slug }).lean();
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    const filter = { topicId: topic._id };
    if (difficulty) filter.difficulty = difficulty;
    if (company) filter.companies = { $regex: company, $options: 'i' };

    const problems = await Problem.find(filter).sort({ problemOrder: 1 }).select('-starterCode -testCases -__v').lean();
    res.json({ success: true, topic, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFullSheet = async (req, res) => {
  try {
    const data = await buildSheetForUser(req.user._id, {
      difficulty: req.query.difficulty,
      company: req.query.company,
    });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleProgress = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { completed } = req.body;

    const existing = await UserProgress.findOne({ userId: req.user._id, problemId }).select('_id');
    let coinsEarned = 0;

    if (completed && !existing) {
      await Promise.all([
        UserProgress.create({ userId: req.user._id, problemId, completed: true, completedAt: new Date() }),
        User.findByIdAndUpdate(req.user._id, { $inc: { coins: COINS_PER_PROBLEM } }),
        recordSolve(req.user._id),
      ]);
      coinsEarned = COINS_PER_PROBLEM;
      checkAndAwardBadges(req.user._id).catch(() => {});
    } else if (!completed && existing) {
      await Promise.all([
        UserProgress.deleteOne({ userId: req.user._id, problemId }),
        User.findByIdAndUpdate(req.user._id, { $inc: { coins: -COINS_PER_PROBLEM } }),
      ]);
      coinsEarned = -COINS_PER_PROBLEM;
    }

    const [user, completedCount, totalProblems] = await Promise.all([
      User.findById(req.user._id).select('coins'),
      UserProgress.countDocuments({ userId: req.user._id, completed: true }),
      Problem.estimatedDocumentCount(),
    ]);

    res.json({
      success: true,
      progress: { problemId, completed },
      coinsEarned,
      coins: user.coins,
      stats: {
        totalProblems,
        completedCount,
        percentage: totalProblems ? Math.round((completedCount / totalProblems) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCompanies = async (_req, res) => {
  try {
    const companies = await Problem.distinct('companies');
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ success: true, companies: companies.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserProgress = async (req, res) => {
  try {
    const progress = await UserProgress.find({ userId: req.user._id, completed: true }).select('problemId').lean();
    res.json({ success: true, progress: Object.fromEntries(progress.map((p) => [p.problemId.toString(), true])) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
