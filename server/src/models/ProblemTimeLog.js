import mongoose from 'mongoose';

const problemTimeLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemSlug: { type: String, required: true, index: true },
    date: { type: String, required: true },
    solveSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemTimeLogSchema.index({ userId: 1, problemSlug: 1, date: 1 }, { unique: true });

export default mongoose.model('ProblemTimeLog', problemTimeLogSchema);
