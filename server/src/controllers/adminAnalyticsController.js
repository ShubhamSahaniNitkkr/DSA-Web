import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';
import Problem from '../models/Problem.js';
import Topic from '../models/Topic.js';
import Activity from '../models/Activity.js';

export const getAnalytics = async (_req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeToday,
      activeWeek,
      totalSolves,
      topSolved,
      leastSolved,
      focusAgg,
      trafficWeek,
      topicCount,
      problemCount,
    ] = await Promise.all([
      User.countDocuments(),
      Activity.distinct('userId', { date: todayStr }).then((u) => u.length),
      Activity.distinct('userId', { updatedAt: { $gte: weekAgo } }).then((u) => u.length),
      UserProgress.countDocuments({ completed: true }),
      UserProgress.aggregate([
        { $match: { completed: true } },
        { $group: { _id: '$problemId', solves: { $sum: 1 } } },
        { $sort: { solves: -1 } },
        { $limit: 15 },
        {
          $lookup: {
            from: 'problems',
            localField: '_id',
            foreignField: '_id',
            as: 'problem',
          },
        },
        { $unwind: '$problem' },
        {
          $project: {
            solves: 1,
            title: '$problem.title',
            slug: '$problem.slug',
            difficulty: '$problem.difficulty',
          },
        },
      ]),
      UserProgress.aggregate([
        { $match: { completed: true } },
        { $group: { _id: '$problemId', solves: { $sum: 1 } } },
        { $sort: { solves: 1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'problems',
            localField: '_id',
            foreignField: '_id',
            as: 'problem',
          },
        },
        { $unwind: '$problem' },
        { $project: { solves: 1, title: '$problem.title', slug: '$problem.slug' } },
      ]),
      Activity.aggregate([
        { $group: { _id: null, totalFocus: { $sum: '$focusMinutes' }, days: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        { $match: { updatedAt: { $gte: weekAgo } } },
        { $group: { _id: '$date', visits: { $sum: 1 }, focusMinutes: { $sum: '$focusMinutes' } } },
        { $sort: { _id: 1 } },
      ]),
      Topic.countDocuments(),
      Problem.countDocuments(),
    ]);

    const avgFocus = focusAgg[0]
      ? Math.round(focusAgg[0].totalFocus / Math.max(focusAgg[0].days, 1))
      : 0;

    const completionRate = problemCount
      ? Math.round((totalSolves / Math.max(totalUsers * problemCount, 1)) * 100)
      : 0;

    res.json({
      success: true,
      analytics: {
        totalUsers,
        activeToday,
        activeWeek,
        totalSolves,
        topicCount,
        problemCount,
        avgFocusMinutesPerDay: avgFocus,
        completionRate,
        topSolved,
        leastSolved,
        trafficWeek,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
