import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import { invalidateCache } from '../utils/cache.js';
import { extractProblemStatement, enrichExamples } from '../utils/sheetEnrich.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_XLSX_PATH = path.resolve(__dirname, '../../../docs/strivers-a2z-dsa.xlsx');

const ACCENT = ['#0d4429', '#1d4ed8', '#7c3aed', '#b45309', '#0e7490', '#be123c', '#4338ca', '#0369a1', '#059669', '#dc2626', '#7c2d12', '#4f46e5', '#0891b2', '#ca8a04', '#9333ea', '#16a34a', '#e11d48', '#2563eb'];

const slugify = (text) =>
  String(text || '').toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'item';

const normDiff = (d) => {
  const v = String(d || 'Medium');
  if (/easy/i.test(v)) return 'Easy';
  if (/hard/i.test(v)) return 'Hard';
  return 'Medium';
};

/**
 * Import A2Z DSA sheet from xlsx. Removes topics not present in the file.
 * @param {string} [xlsxPath]
 * @returns {{ topics: number, problems: number }}
 */
export async function importA2ZSheet(xlsxPath = DEFAULT_XLSX_PATH, { fullReplace = true } = {}) {
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  if (fullReplace) {
    await Problem.deleteMany({});
    await Topic.deleteMany({});
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheetName = wb.SheetNames.find((n) => /a2z|dsa/i.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

  const topicOrder = [];
  const mainToSlug = {};
  for (const row of rows) {
    const main = String(row['Main Topic'] || '').trim();
    if (!main || mainToSlug[main]) continue;
    mainToSlug[main] = slugify(main.split('[')[0] || main);
    topicOrder.push(main);
  }

  for (let i = 0; i < topicOrder.length; i++) {
    const main = topicOrder[i];
    const slug = mainToSlug[main];
    await Topic.findOneAndUpdate(
      { slug },
      {
        title: main,
        slug,
        description: main.replace(/\[.*\]/, '').trim(),
        chapterOrder: i + 1,
        icon: '◆',
        accentColor: ACCENT[i % ACCENT.length],
      },
      { upsert: true }
    );
  }

  const topicIdBySlug = Object.fromEntries((await Topic.find().lean()).map((t) => [t.slug, t._id]));
  let count = 0;

  for (const row of rows) {
    const main = String(row['Main Topic'] || '').trim();
    const topicId = topicIdBySlug[mainToSlug[main]];
    const title = String(row['Problem Name'] || '').trim();
    if (!topicId || !title) continue;
    count++;
    const slug = slugify(title);
    const jsCode = row['Optimal Code (JavaScript)'] || row['Brute Force Code (JavaScript)'] || 'function solve(input) {\n  return input;\n}';
    const problemStatement = extractProblemStatement(row);
    const examples = String(row['Examples'] || '').trim() || enrichExamples(row);
    const sheetData = {
      serialNo: row['S.No'],
      problemLink: String(row['Problem Link'] || '').trim(),
      articleLink: String(row['Article Link'] || '').trim(),
      solveLink: String(row['Solve Link (TUF+)'] || '').trim(),
      editorialLink: String(row['Editorial Link'] || '').trim(),
      youtubeLink: String(row['YouTube Link'] || '').trim(),
      practiceLink: String(row['Practice Link'] || '').trim(),
      articleTitle: String(row['Article Title'] || '').trim(),
      problemStatement,
      examples,
      bruteForce: {
        algorithm: String(row['Brute Force Algorithm'] || '').trim(),
        timeComplexity: String(row['Brute Force Time Complexity'] || '').trim(),
        spaceComplexity: String(row['Brute Force Space Complexity'] || '').trim(),
        codeCpp: String(row['Brute Force Code (C++)'] || '').trim(),
        codeJava: String(row['Brute Force Code (Java)'] || '').trim(),
        codePython: String(row['Brute Force Code (Python)'] || '').trim(),
        codeJs: String(row['Brute Force Code (JavaScript)'] || '').trim(),
      },
      optimal: {
        algorithm: String(row['Optimal Algorithm'] || '').trim(),
        timeComplexity: String(row['Optimal Time Complexity'] || '').trim(),
        spaceComplexity: String(row['Optimal Space Complexity'] || '').trim(),
        codeCpp: String(row['Optimal Code (C++)'] || '').trim(),
        codeJava: String(row['Optimal Code (Java)'] || '').trim(),
        codePython: String(row['Optimal Code (Python)'] || '').trim(),
        codeJs: String(row['Optimal Code (JavaScript)'] || '').trim(),
      },
      otherApproaches: String(row['Other Approaches'] || '').trim(),
      scrapeStatus: String(row['Scrape Status'] || '').trim(),
      fullArticleText: String(row['Full Article Text (fallback)'] || '').trim(),
    };

    await Problem.findOneAndUpdate(
      { topicId, slug },
      {
        topicId,
        title,
        slug,
        subtopic: String(row['Sub Topic'] || '').trim(),
        difficulty: normDiff(row['Difficulty']),
        companies: [],
        problemOrder: count,
        resources: {
          youtube: sheetData.youtubeLink,
          leetcode: sheetData.practiceLink || sheetData.problemLink,
          article: sheetData.articleLink || sheetData.editorialLink,
          codeforces: '',
          affiliate: sheetData.solveLink,
        },
        starterCode: String(jsCode).slice(0, 12000),
        sheetData,
      },
      { upsert: true }
    );
  }

  invalidateCache('sheet:');
  return { topics: topicOrder.length, problems: count, sheetName, rows: rows.length };
}
