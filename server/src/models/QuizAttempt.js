import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    correct: { type: Boolean, required: true },
    coinsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, quizId: 1 }, { unique: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
