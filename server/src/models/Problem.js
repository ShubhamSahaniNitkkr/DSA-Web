import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    subtopic: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
    companies: [{ type: String, trim: true, index: true }],
    problemOrder: { type: Number, required: true },
    resources: {
      youtube: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      codeforces: { type: String, default: '' },
      article: { type: String, default: '' },
      affiliate: { type: String, default: '' },
    },
    starterCode: { type: String, default: 'function solve(input) {\n  // write your solution\n  return input;\n}' },
    sheetData: { type: mongoose.Schema.Types.Mixed, default: {} },
    testCases: [{ input: String, expected: String }],
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemSchema.index({ topicId: 1, problemOrder: 1 });
problemSchema.index({ topicId: 1, slug: 1 }, { unique: true });
problemSchema.index({ companies: 1 });
problemSchema.index({ title: 'text', subtopic: 'text' });

export default mongoose.model('Problem', problemSchema);
