import mongoose from 'mongoose';

const userFavoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  },
  { timestamps: true }
);

userFavoriteSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('UserFavorite', userFavoriteSchema);
