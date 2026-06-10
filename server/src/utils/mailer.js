import nodemailer from 'nodemailer';

const createTransport = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const APP_NAME = 'Shubham Sunny DSA Sheet';
const from = () => process.env.SMTP_FROM || 'noreply@sheetstack.app';

export const sendResetEmail = async (email, resetUrl) => {
  const transport = createTransport();
  const subject = `${APP_NAME} — Reset your password`;
  const html = `
    <p>You requested a password reset for ${APP_NAME}.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `;

  if (!transport) {
    console.log('[DEV] Password reset link:', resetUrl);
    return { dev: true, resetUrl };
  }

  await transport.sendMail({ from: from(), to: email, subject, html });
  return { sent: true };
};

export const sendAlertConfirmation = async (email, name, enabled) => {
  const transport = createTransport();
  const subject = enabled
    ? `${APP_NAME} — Email alerts enabled ✓`
    : `${APP_NAME} — Email alerts updated`;
  const html = enabled
    ? `
      <div style="font-family:sans-serif;max-width:520px">
        <h2 style="color:#0d4429">You're all set, ${name || 'Coder'}!</h2>
        <p>Email practice reminders are now <strong>enabled</strong> for <strong>${email}</strong>.</p>
        <p>You'll receive a daily nudge to keep your DSA streak alive.</p>
        <p style="color:#64748b;font-size:13px">— ${APP_NAME}</p>
      </div>`
    : `
      <div style="font-family:sans-serif;max-width:520px">
        <p>Hi ${name || 'Coder'}, your alert preferences were saved for <strong>${email}</strong>.</p>
        <p>Daily reminders are currently <strong>off</strong>.</p>
        <p style="color:#64748b;font-size:13px">— ${APP_NAME}</p>
      </div>`;

  if (!transport) {
    console.log(`[DEV] Alert confirmation → ${email} (enabled=${enabled})`);
    return { dev: true };
  }

  await transport.sendMail({ from: from(), to: email, subject, html });
  return { sent: true };
};

export const sendPracticeReminder = async (email, name, stats = {}) => {
  const transport = createTransport();
  const { completed = 0, total = 0, coins = 0 } = stats;
  const subject = `${APP_NAME} — Time to practice DSA today 🎯`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px">
      <h2 style="color:#0d4429">Hey ${name || 'Coder'}, ready for today's problems?</h2>
      <p>Your progress: <strong>${completed}/${total}</strong> solved · <strong>${coins}🪙</strong> coins</p>
      <p>Open your sheet and knock out at least one problem today.</p>
      <p><a href="${process.env.CLIENT_URL || 'http://localhost:4321'}" style="background:#0d4429;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open DSA Sheet</a></p>
      <p style="color:#64748b;font-size:12px">Disable alerts anytime from your dashboard.</p>
    </div>`;

  if (!transport) {
    console.log(`[DEV] Practice reminder → ${email}`);
    return { dev: true };
  }

  await transport.sendMail({ from: from(), to: email, subject, html });
  return { sent: true };
};
