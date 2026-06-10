import Activity from '../models/Activity.js';

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const touchVisit = async (userId) => {
  const date = todayKey();
  await Activity.findOneAndUpdate(
    { userId, date },
    { $set: { visited: true } },
    { upsert: true, new: true }
  );
};

export const recordSolve = async (userId) => {
  const date = todayKey();
  await Activity.findOneAndUpdate(
    { userId, date },
    { $set: { visited: true }, $inc: { solvedCount: 1 } },
    { upsert: true, new: true }
  );
};

export const addFocusMinute = async (userId) => {
  const date = todayKey();
  await Activity.findOneAndUpdate(
    { userId, date },
    { $set: { visited: true }, $inc: { focusMinutes: 1 } },
    { upsert: true, new: true }
  );
};
