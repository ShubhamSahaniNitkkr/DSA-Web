import mongoose from 'mongoose';

const userProblemOpenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemSlug: { type: String, required: true, index: true },
    lastOpenedAt: { type: Date, default: Date.now },
    lastSessionSeconds: { type: Number, default: 0 },
    attemptCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

userProblemOpenSchema.index({ userId: 1, problemSlug: 1 }, { unique: true });
userProblemOpenSchema.index({ problemSlug: 1, lastOpenedAt: -1 });

export default mongoose.model('UserProblemOpen', userProblemOpenSchema);
