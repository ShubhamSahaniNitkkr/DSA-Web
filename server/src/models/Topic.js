import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    chapterOrder: {
      type: Number,
      required: true,
      index: true,
    },
    icon: {
      type: String,
      default: '◆',
    },
    accentColor: {
      type: String,
      default: '#6366f1',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Topic', topicSchema);
