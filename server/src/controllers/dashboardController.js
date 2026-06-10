import Activity from '../models/Activity.js';
import UserProgress from '../models/UserProgress.js';
import Problem from '../models/Problem.js';
import UserFavorite from '../models/UserFavorite.js';
import ProblemTimeLog from '../models/ProblemTimeLog.js';
import UserProblemOpen from '../models/UserProblemOpen.js';
import Topic from '../models/Topic.js';
import { BADGES } from '../constants.js';
import { addFocusMinute, touchVisit } from '../utils/activity.js';
import { buildSheetForUser } from '../services/sheetService.js';

export const getDashboard = async (req, res) => {
  try {
    await touchVisit(req.user._id);

    const totalProblems = await Problem.countDocuments();
    const completedCount = await UserProgress.countDocuments({
      userId: req.user._id,
      completed: true,
    });

    const activities = await Activity.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(90)
      .lean();

    const calendar = activities.map((a) => ({
      date: a.date,
      visited: a.visited,
      solved: a.solvedCount > 0,
      solvedCount: a.solvedCount,
      level: a.solvedCount > 0 ? 2 : a.visited ? 1 : 0,
    }));

    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const act = activities.find((a) => a.date === key);
      last14.push({
        date: key,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        focusMinutes: act?.focusMinutes || 0,
        active: (act?.focusMinutes || 0) > 0,
      });
    }

    const earnedBadges = req.user.badges.map((id) => {
      const badge = Object.values(BADGES).find((b) => b.id === id);
      return badge || { id, name: id, desc: '' };
    });

    res.json({
      success: true,
      user: {
        name: req.user.name,
        coins: req.user.coins,
        badges: earnedBadges,
        upiId: req.user.upiId,
      },
      stats: {
        totalProblems,
        completedCount,
        percentage: totalProblems ? Math.round((completedCount / totalProblems) * 100) : 0,
      },
      consistency: last14,
      calendar,
      badgeCatalog: Object.values(BADGES),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDashboardFull = async (req, res) => {
  try {
    await touchVisit(req.user._id);
    const filters = { difficulty: req.query.difficulty, company: req.query.company };

    const [totalProblems, completedCount, activities, sheetData] = await Promise.all([
      Problem.estimatedDocumentCount(),
      UserProgress.countDocuments({ userId: req.user._id, completed: true }),
      Activity.find({ userId: req.user._id }).sort({ date: -1 }).limit(90).select('-__v').lean(),
      buildSheetForUser(req.user._id, filters),
    ]);

    const calendar = activities.map((a) => ({
      date: a.date,
      visited: a.visited,
      solved: a.solvedCount > 0,
      level: a.solvedCount > 0 ? 2 : a.visited ? 1 : 0,
    }));

    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const act = activities.find((a) => a.date === key);
      last14.push({
        date: key,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        focusMinutes: act?.focusMinutes || 0,
        active: (act?.focusMinutes || 0) > 0,
      });
    }

    const earnedBadges = req.user.badges.map((id) => {
      const badge = Object.values(BADGES).find((b) => b.id === id);
      return badge || { id, name: id, desc: '' };
    });

    res.json({
      success: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        coins: req.user.coins,
        badges: earnedBadges,
        upiId: req.user.upiId,
        emailReminders: req.user.emailReminders ?? false,
        reminderTimes: req.user.reminderTimes?.length ? req.user.reminderTimes : ['09:00'],
        reminderDays: req.user.reminderDays?.length ? req.user.reminderDays : [1, 2, 3, 4, 5],
        avatarData: req.user.avatarData ?? '',
      },
      stats: {
        totalProblems,
        completedCount,
        percentage: totalProblems ? Math.round((completedCount / totalProblems) * 100) : 0,
      },
      consistency: last14,
      calendar,
      badgeCatalog: Object.values(BADGES),
      ...sheetData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const recordFocus = async (req, res) => {
  try {
    await addFocusMinute(req.user._id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLastVisited = async (req, res) => {
  try {
    const lastOpen = await UserProblemOpen.findOne({ userId: req.user._id })
      .sort({ lastOpenedAt: -1 })
      .lean();

    if (!lastOpen) {
      return res.json({ success: true, lastVisited: null });
    }

    const problem = await Problem.findOne({ slug: lastOpen.problemSlug })
      .select('title slug difficulty subtopic topicId')
      .lean();

    if (!problem) {
      return res.json({ success: true, lastVisited: null });
    }

    const [topic, timeAgg] = await Promise.all([
      Topic.findById(problem.topicId).select('title').lean(),
      ProblemTimeLog.aggregate([
        { $match: { userId: req.user._id, problemSlug: problem.slug } },
        { $group: { _id: null, totalTimeSeconds: { $sum: '$solveSeconds' } } },
      ]),
    ]);

    res.json({
      success: true,
      lastVisited: {
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        subtopic: problem.subtopic,
        topic: topic?.title || '',
        lastOpenedAt: lastOpen.lastOpenedAt,
        lastSessionSeconds: lastOpen.lastSessionSeconds || 0,
        totalTimeSeconds: timeAgg[0]?.totalTimeSeconds || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favs = await UserFavorite.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const problemIds = favs.map((f) => f.problemId);
    const problems = await Problem.find({ _id: { $in: problemIds } })
      .select('title slug difficulty subtopic topicId')
      .lean();
    const slugs = problems.map((p) => p.slug);

    const [topicIds, timeAgg, opens] = await Promise.all([
      Promise.resolve([...new Set(problems.map((p) => p.topicId.toString()))]),
      ProblemTimeLog.aggregate([
        { $match: { userId: req.user._id, problemSlug: { $in: slugs } } },
        { $group: { _id: '$problemSlug', timeSpentSeconds: { $sum: '$solveSeconds' } } },
      ]),
      UserProblemOpen.find({ userId: req.user._id, problemSlug: { $in: slugs } }).lean(),
    ]);

    const topics = await Topic.find({ _id: { $in: topicIds } }).select('title').lean();
    const topicMap = Object.fromEntries(topics.map((t) => [t._id.toString(), t.title]));
    const timeMap = Object.fromEntries(timeAgg.map((t) => [t._id, t.timeSpentSeconds]));
    const openMap = Object.fromEntries(opens.map((o) => [o.problemSlug, o.lastOpenedAt]));
    const problemMap = Object.fromEntries(problems.map((p) => [p._id.toString(), p]));

    const items = favs
      .map((f) => {
        const p = problemMap[f.problemId.toString()];
        if (!p) return null;
        return {
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          subtopic: p.subtopic,
          topic: topicMap[p.topicId.toString()] || '',
          timeSpentSeconds: timeMap[p.slug] || 0,
          lastOpenedAt: openMap[p.slug] || null,
          favoritedAt: f.createdAt,
        };
      })
      .filter(Boolean);

    res.json({ success: true, favorites: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
