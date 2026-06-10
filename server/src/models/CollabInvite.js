import mongoose from 'mongoose';
import crypto from 'crypto';

const collabInviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    challengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengerName: { type: String, required: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
    inviteeName: { type: String, default: '' },
    problemSlug: { type: String, required: true },
    problemTitle: { type: String, required: true },
    meetLink: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    acceptedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

collabInviteSchema.statics.generateToken = function generateToken() {
  return crypto.randomBytes(24).toString('hex');
};

collabInviteSchema.statics.generateMeetCode = function generateMeetCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
};

export default mongoose.model('CollabInvite', collabInviteSchema);
