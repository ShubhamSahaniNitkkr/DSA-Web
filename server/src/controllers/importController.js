import XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import Quiz from '../models/Quiz.js';
import { invalidateCache } from '../utils/cache.js';

const upsertFromRows = async (topicsRows, problemsRows, quizRows) => {
  const stats = { topics: 0, problems: 0, quiz: 0 };

  for (const row of topicsRows) {
    if (!row.slug) continue;
    await Topic.findOneAndUpdate(
      { slug: String(row.slug).toLowerCase().trim() },
      {
        title: row.title,
        slug: String(row.slug).toLowerCase().trim(),
        description: row.description || '',
        chapterOrder: Number(row.chapterOrder) || 1,
        icon: row.icon || '◆',
        accentColor: row.accentColor || '#6366f1',
      },
      { upsert: true }
    );
    stats.topics++;
  }

  const topicMap = Object.fromEntries((await Topic.find().select('slug _id').lean()).map((t) => [t.slug, t._id]));

  for (const row of problemsRows) {
    const topicSlug = String(row.topicSlug || '').toLowerCase().trim();
    const topicId = topicMap[topicSlug];
    if (!topicId || !row.slug) continue;

    await Problem.findOneAndUpdate(
      { topicId, slug: String(row.slug).toLowerCase().trim() },
      {
        topicId,
        title: row.title,
        slug: String(row.slug).toLowerCase().trim(),
        subtopic: row.subtopic || '',
        difficulty: row.difficulty || 'Easy',
        companies: String(row.companies || '').split(',').map((c) => c.trim()).filter(Boolean),
        problemOrder: Number(row.problemOrder) || 1,
        resources: {
          youtube: row.youtube || '',
          leetcode: row.leetcode || '',
          codeforces: row.codeforces || '',
          article: row.article || '',
          affiliate: row.affiliateLink || row.affiliate || '',
        },
        starterCode: row.starterCode || 'function solve(input) {\n  return input;\n}',
      },
      { upsert: true }
    );
    stats.problems++;
  }

  const problemMap = Object.fromEntries((await Problem.find().select('slug _id').lean()).map((p) => [p.slug, p._id]));

  for (const row of quizRows) {
    const problemId = problemMap[String(row.problemSlug || '').toLowerCase().trim()];
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
      { upsert: true }
    );
    stats.quiz++;
  }

  invalidateCache('sheet:');
  return stats;
};

const parseWorkbook = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  return {
    topics: wb.Sheets.Topics ? XLSX.utils.sheet_to_json(wb.Sheets.Topics) : [],
    problems: wb.Sheets.Problems ? XLSX.utils.sheet_to_json(wb.Sheets.Problems) : [],
    quiz: wb.Sheets.Quiz ? XLSX.utils.sheet_to_json(wb.Sheets.Quiz) : [],
  };
};

const parseCsvBundle = (files) => {
  const read = (name) => {
    const f = files.find((x) => x.originalname.toLowerCase().includes(name));
    if (!f) return [];
    return parse(f.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true });
  };
  return {
    topics: read('topics'),
    problems: read('problems'),
    quiz: read('quiz'),
  };
};

export const importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const rows = parseWorkbook(req.file.buffer);
    const stats = await upsertFromRows(rows.topics, rows.problems, rows.quiz);
    res.json({ success: true, message: 'Excel imported', stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const importCsv = async (req, res) => {
  try {
    const files = req.files?.length ? req.files : req.file ? [req.file] : [];
    if (!files.length) return res.status(400).json({ success: false, message: 'Upload topics.csv, problems.csv, and/or quiz.csv' });

    let rows;
    if (files.length === 1 && files[0].originalname.endsWith('.csv')) {
      const name = files[0].originalname.toLowerCase();
      const data = parse(files[0].buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true });
      rows = {
        topics: name.includes('topic') ? data : [],
        problems: name.includes('problem') ? data : [],
        quiz: name.includes('quiz') ? data : [],
      };
    } else {
      rows = parseCsvBundle(files);
    }

    const stats = await upsertFromRows(rows.topics, rows.problems, rows.quiz);
    res.json({ success: true, message: 'CSV imported', stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportCsv = async (req, res) => {
  try {
    const type = req.params.type;
    let csv = '';
    if (type === 'topics') {
      const rows = await Topic.find().sort({ chapterOrder: 1 }).lean();
      csv = 'chapterOrder,title,slug,description,icon,accentColor\n' +
        rows.map((t) => `${t.chapterOrder},"${t.title}",${t.slug},"${t.description}",${t.icon},${t.accentColor}`).join('\n');
    } else if (type === 'problems') {
      const topics = Object.fromEntries((await Topic.find().lean()).map((t) => [t._id.toString(), t.slug]));
      const rows = await Problem.find().lean();
      csv = 'topicSlug,title,slug,subtopic,difficulty,companies,problemOrder,youtube,leetcode,article,affiliateLink\n' +
        rows.map((p) => `${topics[p.topicId.toString()]},"${p.title}",${p.slug},"${p.subtopic}",${p.difficulty},"${(p.companies || []).join(', ')}",${p.problemOrder},${p.resources?.youtube || ''},${p.resources?.leetcode || ''},${p.resources?.article || ''},${p.resources?.affiliate || ''}`).join('\n');
    } else if (type === 'quiz') {
      const pmap = Object.fromEntries((await Problem.find().lean()).map((p) => [p._id.toString(), p.slug]));
      const rows = await Quiz.find().lean();
      csv = 'problemSlug,question,option1,option2,option3,option4,correctIndex,order\n' +
        rows.map((q) => `${pmap[q.problemId.toString()]},"${q.question}","${q.options[0] || ''}","${q.options[1] || ''}","${q.options[2] || ''}","${q.options[3] || ''}",${q.correctIndex},${q.order}`).join('\n');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
