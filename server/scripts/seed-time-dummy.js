/**
 * Seed dummy ProblemTimeLog entries for demo charts.
 * Usage: node server/scripts/seed-time-dummy.js [email]
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Problem from '../src/models/Problem.js';
import ProblemTimeLog from '../src/models/ProblemTimeLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2] || process.env.SEED_USER_EMAIL;

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = email
    ? await User.findOne({ email })
    : await User.findOne().sort({ createdAt: -1 });
  if (!user) {
    console.error('No user found');
    process.exit(1);
  }

  const problems = await Problem.find().select('slug title').limit(8).lean();
  if (!problems.length) {
    console.error('No problems in DB');
    process.exit(1);
  }

  const today = new Date();
  let created = 0;

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const date = d.toISOString().slice(0, 10);
    const picks = problems.slice(0, 2 + (daysAgo % 3));
    for (const p of picks) {
      const solveSeconds = 600 + Math.floor(Math.random() * 2400);
      await ProblemTimeLog.findOneAndUpdate(
        { userId: user._id, problemSlug: p.slug, date },
        { $set: { solveSeconds } },
        { upsert: true }
      );
      created++;
    }
  }

  await User.findByIdAndUpdate(user._id, {
    totalActiveSeconds: 86400,
    totalSolveSeconds: 43200,
    lastSessionSeconds: 2700,
  });

  console.log(`Seeded ${created} time logs for ${user.email}`);
  await mongoose.disconnect();
};

seed().catch((e) => { console.error(e); process.exit(1); });
