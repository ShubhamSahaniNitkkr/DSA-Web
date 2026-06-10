import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import UserProgress from '../models/UserProgress.js';
import { COINS_PER_PROBLEM } from '../constants.js';
import { getCache, setCache } from '../utils/cache.js';

const SHEET_CACHE_KEY = 'sheet:base';
const CACHE_TTL = 120000;

const loadBaseSheet = async (filters = {}) => {
  const cacheKey = `${SHEET_CACHE_KEY}:${filters.difficulty || ''}:${filters.company || ''}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const problemFilter = {};
  if (filters.difficulty) problemFilter.difficulty = filters.difficulty;
  if (filters.company) problemFilter.companies = { $regex: filters.company, $options: 'i' };

  const [topics, problems, totalProblems] = await Promise.all([
    Topic.find().sort({ chapterOrder: 1 }).select('title slug description chapterOrder icon accentColor').lean(),
    Problem.find(problemFilter)
      .sort({ problemOrder: 1 })
      .select('topicId title slug subtopic difficulty companies problemOrder resources')
      .lean(),
    Problem.countDocuments(),
  ]);

  const problemsByTopic = {};
  for (const p of problems) {
    const key = p.topicId.toString();
    if (!problemsByTopic[key]) problemsByTopic[key] = [];
    problemsByTopic[key].push(p);
  }

  const base = { topics, problemsByTopic, totalProblems };
  setCache(cacheKey, base, CACHE_TTL);
  return base;
};

export const buildSheetForUser = async (userId, filters = {}) => {
  const { topics, problemsByTopic, totalProblems } = await loadBaseSheet(filters);

  const progress = await UserProgress.find({ userId, completed: true })
    .select('problemId')
    .lean();
  const progressMap = Object.fromEntries(progress.map((p) => [p.problemId.toString(), true]));
  const completedCount = progress.length;

  const sheet = topics.map((t) => {
    const topicProblems = problemsByTopic[t._id.toString()] || [];
    const done = topicProblems.filter((p) => progressMap[p._id.toString()]).length;
    return {
      ...t,
      problems: topicProblems,
      totalQuestions: topicProblems.length,
      completedCount: done,
      coinsEarnable: topicProblems.length * COINS_PER_PROBLEM,
      coinsEarned: done * COINS_PER_PROBLEM,
      progressPercent: topicProblems.length ? Math.round((done / topicProblems.length) * 100) : 0,
    };
  });

  return {
    sheet,
    progress: progressMap,
    stats: {
      totalProblems,
      completedCount,
      percentage: totalProblems ? Math.round((completedCount / totalProblems) * 100) : 0,
    },
  };
};
