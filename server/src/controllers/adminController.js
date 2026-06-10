import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import Quiz from '../models/Quiz.js';
import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

export const getAdminData = async (_req, res) => {
  try {
    const [topics, problems, withdrawals, users] = await Promise.all([
      Topic.find().sort({ chapterOrder: 1 }).lean(),
      Problem.find().sort({ problemOrder: 1 }).populate('topicId', 'title').lean(),
      Withdrawal.find().sort({ createdAt: -1 }).limit(50).populate('userId', 'name email').lean(),
      User.countDocuments(),
    ]);
    res.json({ success: true, topics, problems, withdrawals, userCount: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const upsertTopic = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const topic = id
      ? await Topic.findByIdAndUpdate(id, data, { new: true })
      : await Topic.create(data);
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const upsertProblem = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const problem = id
      ? await Problem.findByIdAndUpdate(id, data, { new: true })
      : await Problem.create(data);
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProblem = async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    await Quiz.deleteMany({ problemId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const upsertQuiz = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const quiz = id
      ? await Quiz.findByIdAndUpdate(id, data, { new: true })
      : await Quiz.create(data);
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateWithdrawalStatus = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
