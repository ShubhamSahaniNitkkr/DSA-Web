/**
 * Derive problem statement / description when Excel cell is empty.
 */

const STOP_MARKERS = /^(Examples?|Example \d|Brute Force|Optimal|Solution|Approach|Code|Intuition|Note:|Constraints?|Follow[\s-]?up)/im;

export function extractProblemStatement(row) {
  const existing = String(row['Problem Statement'] || '').trim();
  if (existing.length > 40) return existing;

  const full = String(row['Full Article Text (fallback)'] || '').trim();
  const examples = String(row['Examples'] || '').trim();
  const title = String(row['Problem Name'] || '').trim();
  const sub = String(row['Sub Topic'] || '').trim();
  const main = String(row['Main Topic'] || '').trim();
  const articleTitle = String(row['Article Title'] || '').trim();
  const diff = String(row['Difficulty'] || 'Medium').trim();

  if (full) {
    const psIdx = full.search(/Problem Statement:\s*/i);
    if (psIdx >= 0) {
      const after = full.slice(psIdx).replace(/^Problem Statement:\s*/i, '');
      const cut = after.split(STOP_MARKERS)[0].trim();
      if (cut.length > 40) return cleanText(cut);
    }

    const intro = extractIntro(full, articleTitle || title);
    if (intro.length > 60) return intro;
  }

  if (examples) {
    return [
      `${title} (${diff})`,
      sub ? `Category: ${sub}` : '',
      '',
      'Examples:',
      examples,
    ].filter(Boolean).join('\n');
  }

  const parts = [
    `${title} — ${diff} level problem`,
    sub && `Sub-topic: ${sub}`,
    main && `Chapter: ${cleanTopicName(main)}`,
    articleTitle && `Reference: ${articleTitle}`,
    '',
    'Open the practice link or editorial tab for the full problem details and video walkthrough.',
  ].filter(Boolean);

  return parts.join('\n');
}

function cleanTopicName(t) {
  return t.replace(/\[.*?\]/g, '').trim();
}

function cleanText(s) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s+/g, '$1\n\n')
    .trim()
    .slice(0, 4000);
}

function extractIntro(full, title) {
  let text = full;
  if (title) text = text.replace(new RegExp(escapeRe(title), 'i'), '').trim();
  text = text.replace(/^Introduction\s*/i, '').trim();

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunk = sentences.slice(0, 4).join(' ').trim();
  if (chunk.length > 80) {
    return `**${title}**\n\n${cleanText(chunk)}`;
  }

  const para = text.split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/).find((p) => p.trim().length > 100);
  if (para) return `**${title}**\n\n${cleanText(para.slice(0, 1500))}`;

  return cleanText(text.slice(0, 800));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function enrichExamples(row) {
  const ex = String(row['Examples'] || '').trim();
  if (ex) return ex;

  const full = String(row['Full Article Text (fallback)'] || '');
  const exIdx = full.search(/Examples?\s*:/i);
  if (exIdx < 0) return '';

  const after = full.slice(exIdx).replace(/^Examples?\s*:\s*/i, '');
  const cut = after.split(/Brute Force|Optimal Solution|Solution:|Approach \d/i)[0].trim();
  return cut.slice(0, 3000);
}
