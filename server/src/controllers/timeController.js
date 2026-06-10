import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Problem from '../models/Problem.js';
import UserProgress from '../models/UserProgress.js';
import UserProblemOpen from '../models/UserProblemOpen.js';
import ProblemTimeLog from '../models/ProblemTimeLog.js';
import { todayKey } from '../utils/activity.js';

export const syncTime = async (req, res) => {
  try {
    const { activeSeconds = 0, solveSeconds = 0, lastSessionSeconds, problemSlug } = req.body;
    const inc = {};
    if (activeSeconds > 0) inc.totalActiveSeconds = activeSeconds;
    if (solveSeconds > 0) inc.totalSolveSeconds = solveSeconds;
    const update = {};
    if (Object.keys(inc).length) update.$inc = inc;
    if (typeof lastSessionSeconds === 'number') update.$set = { lastSessionSeconds };

    if (Object.keys(update).length) {
      await User.findByIdAndUpdate(req.user._id, update);
    }

    if (problemSlug) {
      const openUpdate = { lastOpenedAt: new Date() };
      if (typeof lastSessionSeconds === 'number' && lastSessionSeconds > 0) {
        openUpdate.lastSessionSeconds = lastSessionSeconds;
      }
      await UserProblemOpen.findOneAndUpdate(
        { userId: req.user._id, problemSlug },
        { $set: openUpdate },
        { upsert: true }
      );
    }

    if (solveSeconds > 0 && problemSlug) {
      const date = todayKey();
      await ProblemTimeLog.findOneAndUpdate(
        { userId: req.user._id, problemSlug, date },
        { $inc: { solveSeconds } },
        { upsert: true }
      );
      await Activity.findOneAndUpdate(
        { userId: req.user._id, date },
        { $set: { visited: true }, $inc: { focusMinutes: Math.floor(solveSeconds / 60) || 1 } },
        { upsert: true }
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTimeStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('totalActiveSeconds totalSolveSeconds lastSessionSeconds').lean();
    res.json({
      success: true,
      stats: {
        totalActiveSeconds: user?.totalActiveSeconds || 0,
        totalSolveSeconds: user?.totalSolveSeconds || 0,
        lastSessionSeconds: user?.lastSessionSeconds || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function demoHistory(slug) {
  const seed = [...slug].reduce((n, c) => n + c.charCodeAt(0), 0);
  const history = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const active = (seed + i) % 5 !== 0;
    const minutes = active ? 15 + ((seed * (i + 1)) % 45) : 0;
    if (minutes > 0) history.push({ date, minutes });
  }
  return history;
}

function demoInsights(slug) {
  const seed = [...slug].reduce((n, c) => n + c.charCodeAt(0), 0);
  const names = ['Ananya M.', 'Vikram R.', 'Sneha P.', 'Arjun D.'];
  return {
    lastAttempted: {
      name: names[seed % names.length],
      at: new Date(Date.now() - (30 + (seed % 90)) * 60000).toISOString(),
    },
    fastestSolver: {
      name: names[(seed + 1) % names.length],
      timeSeconds: 480 + (seed % 1200),
    },
    totalSolvers: 8 + (seed % 24),
    demo: true,
  };
}

export const getProblemInsights = async (req, res) => {
  try {
    const { slug } = req.params;
    const problem = await Problem.findOne({ slug }).select('_id').lean();
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const [lastOpen, myOpen, timeByUser, myTimeAgg, totalSolvers, completedRows] = await Promise.all([
      UserProblemOpen.findOne({ problemSlug: slug }).sort({ lastOpenedAt: -1 }).lean(),
      UserProblemOpen.findOne({ userId: req.user._id, problemSlug: slug }).lean(),
      ProblemTimeLog.aggregate([
        { $match: { problemSlug: slug } },
        { $group: { _id: '$userId', timeSeconds: { $sum: '$solveSeconds' } } },
      ]),
      ProblemTimeLog.aggregate([
        { $match: { userId: req.user._id, problemSlug: slug } },
        { $group: { _id: null, timeSeconds: { $sum: '$solveSeconds' } } },
      ]),
      UserProgress.countDocuments({ problemId: problem._id, completed: true }),
      UserProgress.find({ problemId: problem._id, completed: true }).select('userId').lean(),
    ]);

    const completedIds = new Set(completedRows.map((r) => r.userId.toString()));
    const fastestEntry = timeByUser
      .filter((t) => completedIds.has(t._id.toString()) && t.timeSeconds > 0)
      .sort((a, b) => a.timeSeconds - b.timeSeconds)[0];

    const insights = {
      lastAttempted: null,
      fastestSolver: null,
      totalSolvers,
      you: {
        lastAttemptedAt: myOpen?.lastOpenedAt || null,
        lastSessionSeconds: myOpen?.lastSessionSeconds || 0,
        totalTimeSeconds: myTimeAgg[0]?.timeSeconds || 0,
        attemptCount: myOpen?.attemptCount || 0,
      },
      demo: false,
    };

    if (lastOpen) {
      const u = await User.findById(lastOpen.userId).select('name').lean();
      insights.lastAttempted = {
        name: u?.name || 'Someone',
        at: lastOpen.lastOpenedAt,
        isYou: lastOpen.userId.toString() === req.user._id.toString(),
      };
    }

    if (fastestEntry) {
      const u = await User.findById(fastestEntry._id).select('name').lean();
      insights.fastestSolver = {
        name: u?.name || 'Someone',
        timeSeconds: fastestEntry.timeSeconds,
        isYou: fastestEntry._id.toString() === req.user._id.toString(),
      };
    }

    const hasRealData = insights.lastAttempted || insights.fastestSolver
      || insights.you.lastAttemptedAt || insights.you.totalTimeSeconds > 0;

    if (!hasRealData) {
      const demo = demoInsights(slug);
      demo.you = { lastAttemptedAt: null, lastSessionSeconds: 0, totalTimeSeconds: 0, attemptCount: 0 };
      return res.json({ success: true, insights: demo });
    }

    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProblemTimeHistory = async (req, res) => {
  try {
    const { slug } = req.params;
    const logs = await ProblemTimeLog.find({ userId: req.user._id, problemSlug: slug })
      .sort({ date: -1 })
      .limit(14)
      .lean();
    const history = logs.map((l) => ({ date: l.date, minutes: Math.round(l.solveSeconds / 60) })).reverse();
    res.json({
      success: true,
      history: history.length ? history : demoHistory(slug),
      demo: !history.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
