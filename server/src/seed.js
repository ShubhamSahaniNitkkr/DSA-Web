import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import { ADMIN_EMAIL } from './constants.js';
import { importA2ZSheet } from './services/a2zImport.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    const result = await importA2ZSheet();
    console.log(`Sheet: ${result.topics} chapters, ${result.problems} problems`);

    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        name: 'Shubham Sunny',
        email: ADMIN_EMAIL,
        password: 'admin123',
        role: 'admin',
        coins: 0,
      });
      console.log(`Admin created: ${ADMIN_EMAIL} / admin123`);
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log(`Admin exists: ${ADMIN_EMAIL}`);
    }

    console.log('Seed completed — full DSA sheet loaded from Excel');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
