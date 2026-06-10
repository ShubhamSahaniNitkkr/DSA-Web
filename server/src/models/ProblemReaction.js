import mongoose from 'mongoose';

const problemReactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    reaction: { type: String, enum: ['like', 'dislike'], required: true },
  },
  { timestamps: true }
);

problemReactionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('ProblemReaction', problemReactionSchema);
