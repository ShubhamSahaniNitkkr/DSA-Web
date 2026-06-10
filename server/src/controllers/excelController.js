import XLSX from 'xlsx';
import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import Quiz from '../models/Quiz.js';
import { invalidateCache } from '../utils/cache.js';
import { extractProblemStatement, enrichExamples } from '../utils/sheetEnrich.js';

const ACCENT_COLORS = ['#0d4429', '#1d4ed8', '#7c3aed', '#b45309', '#0e7490', '#be123c', '#4338ca'];

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'item';

const normalizeDifficulty = (d) => {
  const v = String(d || 'Medium').trim();
  if (/easy/i.test(v)) return 'Easy';
  if (/hard/i.test(v)) return 'Hard';
  return 'Medium';
};

/** Striver A2Z single-sheet format from scraper */
async function importStriverA2Z(wb, stats) {
  const sheetName = wb.SheetNames.find((n) => /a2z/i.test(n) || /dsa sheet/i.test(n));
  if (!sheetName) return false;

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  if (!rows.length) return false;

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
        accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
      },
      { upsert: true, new: true }
    );
    stats.topics++;
  }

  const topicIdBySlug = Object.fromEntries((await Topic.find().lean()).map((t) => [t.slug, t._id]));

  let problemOrder = 0;
  for (const row of rows) {
    const main = String(row['Main Topic'] || '').trim();
    const topicSlug = mainToSlug[main];
    const topicId = topicIdBySlug[topicSlug];
    const title = String(row['Problem Name'] || '').trim();
    if (!topicId || !title) continue;

    problemOrder++;
    const slug = slugify(title);
    const jsCode =
      row['Optimal Code (JavaScript)'] ||
      row['Brute Force Code (JavaScript)'] ||
      'function solve(input) {\n  return input;\n}';

    const sheetData = {
      serialNo: row['S.No'],
      problemLink: String(row['Problem Link'] || '').trim(),
      articleLink: String(row['Article Link'] || '').trim(),
      solveLink: String(row['Solve Link (TUF+)'] || '').trim(),
      editorialLink: String(row['Editorial Link'] || '').trim(),
      youtubeLink: String(row['YouTube Link'] || '').trim(),
      practiceLink: String(row['Practice Link'] || '').trim(),
      articleTitle: String(row['Article Title'] || '').trim(),
      problemStatement: extractProblemStatement(row),
      examples: String(row['Examples'] || '').trim() || enrichExamples(row),
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
        difficulty: normalizeDifficulty(row['Difficulty']),
        companies: [],
        problemOrder,
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
      { upsert: true, new: true }
    );
    stats.problems++;
  }

  return true;
}

const exportWorkbook = async () => {
  const topics = await Topic.find().sort({ chapterOrder: 1 }).lean();
  const problems = await Problem.find().sort({ problemOrder: 1 }).lean();
  const topicSlugMap = Object.fromEntries(topics.map((t) => [t._id.toString(), t.slug]));
  const quizzes = await Quiz.find().lean();
  const problemSlugMap = Object.fromEntries(problems.map((p) => [p._id.toString(), p.slug]));

  const topicsSheet = topics.map((t) => ({
    chapterOrder: t.chapterOrder,
    title: t.title,
    slug: t.slug,
    description: t.description,
    icon: t.icon,
    accentColor: t.accentColor,
  }));

  const problemsSheet = problems.map((p) => ({
    topicSlug: topicSlugMap[p.topicId.toString()],
    title: p.title,
    slug: p.slug,
    subtopic: p.subtopic,
    difficulty: p.difficulty,
    companies: (p.companies || []).join(', '),
    problemOrder: p.problemOrder,
    youtube: p.resources?.youtube || '',
    leetcode: p.resources?.leetcode || '',
    codeforces: p.resources?.codeforces || '',
    article: p.resources?.article || '',
    affiliateLink: p.resources?.affiliate || '',
    starterCode: p.starterCode || '',
  }));

  const quizSheet = quizzes.map((q) => ({
    problemSlug: problemSlugMap[q.problemId.toString()],
    question: q.question,
    option1: q.options[0] || '',
    option2: q.options[1] || '',
    option3: q.options[2] || '',
    option4: q.options[3] || '',
    correctIndex: q.correctIndex,
    order: q.order,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topicsSheet), 'Topics');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(problemsSheet), 'Problems');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quizSheet), 'Quiz');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const downloadExcel = async (_req, res) => {
  try {
    const buffer = await exportWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sheetstack-content.xlsx');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const stats = { topics: 0, problems: 0, quiz: 0 };

    const isStriver = await importStriverA2Z(wb, stats);
    if (isStriver) {
      invalidateCache('sheet:');
      return res.json({
        success: true,
        message: 'DSA sheet imported successfully',
        stats,
        format: 'a2z-sheet',
      });
    }

    if (wb.Sheets.Topics) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets.Topics);
      for (const row of rows) {
        if (!row.slug) continue;
        await Topic.findOneAndUpdate(
          { slug: String(row.slug).toLowerCase() },
          {
            title: row.title,
            slug: String(row.slug).toLowerCase(),
            description: row.description || '',
            chapterOrder: Number(row.chapterOrder) || 1,
            icon: row.icon || '◆',
            accentColor: row.accentColor || '#6366f1',
          },
          { upsert: true, new: true }
        );
        stats.topics++;
      }
    }

    const topicMap = Object.fromEntries(
      (await Topic.find().lean()).map((t) => [t.slug, t._id])
    );

    if (wb.Sheets.Problems) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets.Problems);
      for (const row of rows) {
        const topicSlug = String(row.topicSlug || '').toLowerCase();
        const topicId = topicMap[topicSlug];
        if (!topicId || !row.slug) continue;

        await Problem.findOneAndUpdate(
          { topicId, slug: String(row.slug).toLowerCase() },
          {
            topicId,
            title: row.title,
            slug: String(row.slug).toLowerCase(),
            subtopic: row.subtopic || '',
            difficulty: row.difficulty || 'Easy',
            companies: String(row.companies || '').split(',').map((c) => c.trim()).filter(Boolean),
            problemOrder: Number(row.problemOrder) || 1,
            resources: {
              youtube: row.youtube || '',
              leetcode: row.leetcode || '',
              codeforces: row.codeforces || '',
              article: row.article || '',
              affiliate: row.affiliateLink || '',
            },
            starterCode: row.starterCode || 'function solve(input) {\n  return input;\n}',
          },
          { upsert: true, new: true }
        );
        stats.problems++;
      }
    }

    const problemMap = Object.fromEntries(
      (await Problem.find().lean()).map((p) => [p.slug, p._id])
    );

    if (wb.Sheets.Quiz) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets.Quiz);
      for (const row of rows) {
        const problemId = problemMap[String(row.problemSlug || '').toLowerCase()];
        if (!problemId || !row.question) continue;

        const options = [row.option1, row.option2, row.option3, row.option4].filter(Boolean);
        await Quiz.findOneAndUpdate(
          { problemId, question: row.question },
          {
            problemId,
            question: row.question,
            options,
            correctIndex: Number(row.correctIndex) || 0,
            order: Number(row.order) || 0,
          },
          { upsert: true, new: true }
        );
        stats.quiz++;
      }
    }

    invalidateCache('sheet:');
    res.json({ success: true, message: 'Excel imported successfully', stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
