import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Activity from '../models/Activity.js';
import { BADGES } from '../constants.js';

const award = async (userId, badgeId) => {
  await User.findByIdAndUpdate(userId, { $addToSet: { badges: badgeId } });
};

export const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const solved = await UserProgress.countDocuments({ userId, completed: true });
  const quizCount = await QuizAttempt.countDocuments({ userId, correct: true });

  if (solved >= 1 && !user.badges.includes(BADGES.FIRST_SOLVE.id)) {
    await award(userId, BADGES.FIRST_SOLVE.id);
  }
  if (solved >= 10 && !user.badges.includes(BADGES.TEN_SOLVES.id)) {
    await award(userId, BADGES.TEN_SOLVES.id);
  }
  if (solved >= 50 && !user.badges.includes(BADGES.FIFTY_SOLVES.id)) {
    await award(userId, BADGES.FIFTY_SOLVES.id);
  }
  if (quizCount >= 20 && !user.badges.includes(BADGES.QUIZ_MASTER.id)) {
    await award(userId, BADGES.QUIZ_MASTER.id);
  }

  const activities = await Activity.find({ userId, visited: true })
    .sort({ date: -1 })
    .limit(7)
    .lean();
  if (activities.length >= 7) {
    let streak = 1;
    for (let i = 1; i < activities.length; i++) {
      const prev = new Date(activities[i - 1].date);
      const curr = new Date(activities[i].date);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    if (streak >= 7 && !user.badges.includes(BADGES.STREAK_7.id)) {
      await award(userId, BADGES.STREAK_7.id);
    }
  }
};
