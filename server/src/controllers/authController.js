import crypto from 'crypto';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { sendResetEmail } from '../utils/mailer.js';
import { touchVisit } from '../utils/activity.js';
import { BADGES, ADMIN_EMAIL } from '../constants.js';

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  coins: user.coins,
  upiId: user.upiId,
  badges: user.badges,
  avatarData: user.avatarData ?? '',
  emailReminders: user.emailReminders ?? false,
  reminderTimes: user.reminderTimes?.length ? user.reminderTimes : ['09:00'],
  reminderDays: user.reminderDays?.length ? user.reminderDays : [1, 2, 3, 4, 5],
  whatsapp: user.whatsapp ?? '',
});

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'student',
    });
    const token = signToken(user._id);
    await touchVisit(user._id);
    res.status(201).json({ success: true, token, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    const token = signToken(user._id);
    await touchVisit(user._id);
    res.json({ success: true, token, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = async (req, res) => {
  await touchVisit(req.user._id);
  res.json({
    success: true,
    user: userPayload(req.user),
    badgeCatalog: Object.values(BADGES),
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link was sent' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4321';
    const resetUrl = `${clientUrl}/login?reset=${resetToken}`;
    const mailResult = await sendResetEmail(email, resetUrl);

    res.json({
      success: true,
      message: 'If that email exists, a reset link was sent',
      ...(mailResult?.dev ? { devResetUrl: resetUrl } : {}),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { emailReminders, email, reminderTimes, reminderDays } = req.body;
    const updates = {};

    if (typeof email === 'string' && email.trim()) {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address' });
      }
      const taken = await User.findOne({ email: normalized, _id: { $ne: req.user._id } });
      if (taken) {
        return res.status(400).json({ success: false, message: 'That email is already registered' });
      }
      updates.email = normalized;
    }

    if (Array.isArray(reminderTimes)) {
      const times = [...new Set(
        reminderTimes.map((t) => String(t).trim()).filter((t) => TIME_RE.test(t))
      )].sort();
      if (!times.length) {
        return res.status(400).json({ success: false, message: 'Add at least one reminder time' });
      }
      updates.reminderTimes = times;
    }

    if (Array.isArray(reminderDays)) {
      const days = [...new Set(reminderDays.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6))].sort();
      if (!days.length) {
        return res.status(400).json({ success: false, message: 'Select at least one day' });
      }
      updates.reminderDays = days;
    }

    if (typeof emailReminders === 'boolean') {
      const targetEmail = updates.email || req.user.email;
      if (emailReminders && !targetEmail?.trim()) {
        return res.status(400).json({ success: false, message: 'Add your email to enable alerts' });
      }
      if (emailReminders) {
        const times = updates.reminderTimes || req.user.reminderTimes || ['09:00'];
        const days = updates.reminderDays || req.user.reminderDays || [1, 2, 3, 4, 5];
        if (!times.length || !days.length) {
          return res.status(400).json({ success: false, message: 'Set reminder times and days first' });
        }
      }
      updates.emailReminders = emailReminders;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    const targetEmail = user.email;
    if (targetEmail && (typeof emailReminders === 'boolean' || updates.email)) {
      const { sendAlertConfirmation } = await import('../utils/mailer.js');
      await sendAlertConfirmation(targetEmail, user.name, user.emailReminders).catch((e) => {
        console.error('[email] confirmation failed:', e.message);
      });
    }
    res.json({ success: true, user: userPayload(user), emailSent: !!targetEmail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { avatarData } = req.body;
    if (avatarData && typeof avatarData === 'string' && avatarData.length > 600000) {
      return res.status(400).json({ success: false, message: 'Image too large (max ~400KB)' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarData: avatarData || '' },
      { new: true }
    );
    res.json({ success: true, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
