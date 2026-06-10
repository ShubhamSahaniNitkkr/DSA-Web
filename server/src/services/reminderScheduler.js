import cron from 'node-cron';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import UserProgress from '../models/UserProgress.js';
import { sendPracticeReminder } from '../utils/mailer.js';

const TZ = process.env.REMINDER_TZ || 'Asia/Kolkata';
const CRON_EXPR = process.env.REMINDER_CRON || '* * * * *';

const DAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function scheduleNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  const hour = get('hour').padStart(2, '0');
  const minute = get('minute').padStart(2, '0');
  return {
    day: DAY_MAP[get('weekday')] ?? 0,
    time: `${hour}:${minute}`,
  };
}

async function sendScheduledReminders() {
  const { day, time } = scheduleNow();
  const users = await User.find({
    emailReminders: true,
    reminderDays: day,
    reminderTimes: time,
  }).select('name email coins').lean();

  if (!users.length) return;

  const total = await Problem.countDocuments();
  console.log(`[reminders] ${time} (day ${day}) → ${users.length} user(s)`);

  for (const user of users) {
    if (!user.email?.trim()) continue;
    try {
      const completed = await UserProgress.countDocuments({ userId: user._id, completed: true });
      await sendPracticeReminder(user.email, user.name, {
        completed,
        total,
        coins: user.coins || 0,
      });
    } catch (err) {
      console.error(`[reminders] Failed for ${user.email}:`, err.message);
    }
  }
}

export function startReminderScheduler() {
  if (process.env.DISABLE_REMINDER_CRON === 'true') {
    console.log('[reminders] Cron disabled (DISABLE_REMINDER_CRON=true)');
    return;
  }

  cron.schedule(CRON_EXPR, () => {
    sendScheduledReminders().catch((e) => console.error('[reminders]', e));
  });

  console.log(`[reminders] Scheduled: ${CRON_EXPR} (${TZ})`);
}
