import mongoose from 'mongoose';

const userNoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

userNoteSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('UserNote', userNoteSchema);
