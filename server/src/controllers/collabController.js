import User from '../models/User.js';
import Problem from '../models/Problem.js';
import CollabInvite from '../models/CollabInvite.js';
import { sendCollabInvite } from '../utils/mailer.js';

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:4321';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loadInvite = async (token) => {
  const invite = await CollabInvite.findOne({ token });
  if (!invite) return { error: { status: 404, message: 'Invite not found or expired' } };
  if (invite.expiresAt < new Date()) return { error: { status: 410, message: 'This invite has expired' } };
  return { invite };
};

export const verifyInviteeEmail = async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.json({ valid: false });
    }
    if (email === req.user.email.toLowerCase()) {
      return res.json({ valid: false, self: true });
    }
    const invitee = await User.findOne({ email }).select('name email');
    return res.json({
      valid: true,
      registered: Boolean(invitee),
      name: invitee?.name || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not verify email' });
  }
};

export const startCollab = async (req, res) => {
  try {
    const inviteeEmail = String(req.body.inviteeEmail || '').trim().toLowerCase();
    const problemSlug = String(req.body.problemSlug || '').trim();

    if (!inviteeEmail || !problemSlug) {
      return res.status(400).json({ success: false, message: 'Email and problem are required' });
    }
    if (!EMAIL_RE.test(inviteeEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }
    if (inviteeEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'You cannot invite yourself' });
    }

    const problem = await Problem.findOne({ slug: problemSlug }).select('title slug');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const existingUser = await User.findOne({ email: inviteeEmail }).select('name');
    const meetCode = CollabInvite.generateMeetCode();
    const meetLink = `https://meet.google.com/${meetCode}`;
    const token = CollabInvite.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invite = await CollabInvite.create({
      token,
      challengerId: req.user._id,
      challengerName: req.user.name,
      inviteeEmail,
      inviteeName: existingUser?.name || '',
      problemSlug: problem.slug,
      problemTitle: problem.title,
      meetLink,
      expiresAt,
    });

    const acceptUrl = `${clientUrl()}/collab/accept/${token}`;
    await sendCollabInvite({
      to: inviteeEmail,
      inviteeName: existingUser?.name || inviteeEmail.split('@')[0],
      challengerName: req.user.name,
      problemTitle: problem.title,
      meetLink,
      acceptUrl,
    });

    res.json({
      success: true,
      meetLink: invite.meetLink,
      problemSlug: invite.problemSlug,
      problemTitle: invite.problemTitle,
      inviteeEmail,
      acceptUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not start collab session' });
  }
};

export const previewCollabInvite = async (req, res) => {
  try {
    const { invite, error } = await loadInvite(req.params.token);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    res.json({
      challengerName: invite.challengerName,
      problemTitle: invite.problemTitle,
      problemSlug: invite.problemSlug,
      inviteeEmail: invite.inviteeEmail,
      status: invite.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load invite' });
  }
};

export const getCollabInvite = async (req, res) => {
  try {
    const { invite, error } = await loadInvite(req.params.token);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const userEmail = req.user.email.toLowerCase();
    const isInvitee = userEmail === invite.inviteeEmail;
    const isChallenger = String(req.user._id) === String(invite.challengerId);

    if (!isInvitee && !isChallenger) {
      return res.status(403).json({
        success: false,
        message: `Sign in with ${invite.inviteeEmail} to accept this challenge`,
        inviteeEmail: invite.inviteeEmail,
      });
    }

    res.json({
      challengerName: invite.challengerName,
      inviteeName: invite.inviteeName || invite.inviteeEmail.split('@')[0],
      inviteeEmail: invite.inviteeEmail,
      problemTitle: invite.problemTitle,
      problemSlug: invite.problemSlug,
      meetLink: invite.meetLink,
      status: invite.status,
      isInvitee,
      isChallenger,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load invite' });
  }
};

export const acceptCollab = async (req, res) => {
  try {
    const { invite, error } = await loadInvite(req.params.token);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    if (req.user.email.toLowerCase() !== invite.inviteeEmail) {
      return res.status(403).json({
        success: false,
        message: `Use ${invite.inviteeEmail} to accept this challenge`,
        inviteeEmail: invite.inviteeEmail,
      });
    }

    if (invite.status !== 'accepted') {
      invite.status = 'accepted';
      invite.acceptedAt = new Date();
      invite.inviteeName = req.user.name;
      await invite.save();
    }

    res.json({
      success: true,
      meetLink: invite.meetLink,
      problemSlug: invite.problemSlug,
      problemTitle: invite.problemTitle,
      challengerName: invite.challengerName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not accept challenge' });
  }
};
