/**
 * Import docs/strivers-a2z-dsa.xlsx into MongoDB
 * Usage: node server/scripts/import-a2z-sheet.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { importA2ZSheet, DEFAULT_XLSX_PATH } from '../src/services/a2zImport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await importA2ZSheet(DEFAULT_XLSX_PATH);
  console.log(`Imported ${result.problems} problems across ${result.topics} topics (${result.rows} rows)`);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((e) => { console.error(e); process.exit(1); });
