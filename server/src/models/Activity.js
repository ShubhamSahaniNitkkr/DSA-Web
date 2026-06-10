import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    visited: { type: Boolean, default: false },
    solvedCount: { type: Number, default: 0 },
    focusMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('Activity', activitySchema);
