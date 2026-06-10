import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    coins: { type: Number, default: 0 },
    upiId: { type: String, default: '' },
    badges: [{ type: String }],
    avatarData: { type: String, default: '' },
    totalActiveSeconds: { type: Number, default: 0 },
    totalSolveSeconds: { type: Number, default: 0 },
    lastSessionSeconds: { type: Number, default: 0 },
    emailReminders: { type: Boolean, default: false },
    reminderTimes: { type: [String], default: ['09:00'] },
    reminderDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    whatsapp: { type: String, default: '' },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
