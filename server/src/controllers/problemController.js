import Problem from '../models/Problem.js';
import Topic from '../models/Topic.js';
import UserNote from '../models/UserNote.js';
import UserFavorite from '../models/UserFavorite.js';
import UserProblemOpen from '../models/UserProblemOpen.js';
import ProblemReaction from '../models/ProblemReaction.js';
import UserProgress from '../models/UserProgress.js';

export const getProblemDetail = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).lean();
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const topic = await Topic.findById(problem.topicId).lean();
    const [note, favorite, reaction, completed] = await Promise.all([
      UserNote.findOne({ userId: req.user._id, problemId: problem._id }).lean(),
      UserFavorite.findOne({ userId: req.user._id, problemId: problem._id }).lean(),
      ProblemReaction.findOne({ userId: req.user._id, problemId: problem._id }).lean(),
      UserProgress.findOne({ userId: req.user._id, problemId: problem._id, completed: true }).lean(),
    ]);

    await UserProblemOpen.findOneAndUpdate(
      { userId: req.user._id, problemSlug: problem.slug },
      { $set: { lastOpenedAt: new Date() }, $inc: { attemptCount: 1 } },
      { upsert: true }
    );

    res.json({
      success: true,
      problem,
      topic,
      note: note?.content || '',
      isFavorite: !!favorite,
      userReaction: reaction?.reaction || null,
      completed: !!completed,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveNote = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const note = await UserNote.findOneAndUpdate(
      { userId: req.user._id, problemId: problem._id },
      { content: req.body.content },
      { upsert: true, new: true }
    );
    res.json({ success: true, note: note.content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const existing = await UserFavorite.findOne({ userId: req.user._id, problemId: problem._id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, isFavorite: false });
    }
    await UserFavorite.create({ userId: req.user._id, problemId: problem._id });
    res.json({ success: true, isFavorite: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setReaction = async (req, res) => {
  try {
    const { reaction } = req.body;
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const existing = await ProblemReaction.findOne({ userId: req.user._id, problemId: problem._id });
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (existing) {
      if (existing.reaction === reaction) {
        await existing.deleteOne();
        if (reaction === 'like') likeDelta = -1;
        else dislikeDelta = -1;
      } else {
        existing.reaction = reaction;
        await existing.save();
        if (reaction === 'like') { likeDelta = 1; dislikeDelta = -1; }
        else { dislikeDelta = 1; likeDelta = -1; }
      }
    } else {
      await ProblemReaction.create({ userId: req.user._id, problemId: problem._id, reaction });
      if (reaction === 'like') likeDelta = 1;
      else dislikeDelta = 1;
    }

    if (likeDelta || dislikeDelta) {
      await Problem.findByIdAndUpdate(problem._id, { $inc: { likes: likeDelta, dislikes: dislikeDelta } });
    }

    const updated = await Problem.findById(problem._id).lean();
    const current = await ProblemReaction.findOne({ userId: req.user._id, problemId: problem._id });
    res.json({
      success: true,
      likes: updated.likes,
      dislikes: updated.dislikes,
      userReaction: current?.reaction || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const runCode = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).lean();
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const { code } = req.body;
    const results = [];
    let allPassed = true;

    for (const tc of problem.testCases || []) {
      try {
        const fn = new Function('input', `${code}\nreturn solve(input);`);
        const output = fn(tc.input);
        const expected = JSON.parse(tc.expected);
        const passed = JSON.stringify(output) === JSON.stringify(expected);
        results.push({ input: tc.input, expected, output, passed });
        if (!passed) allPassed = false;
      } catch (err) {
        results.push({ input: tc.input, error: err.message, passed: false });
        allPassed = false;
      }
    }

    res.json({ success: true, results, allPassed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
