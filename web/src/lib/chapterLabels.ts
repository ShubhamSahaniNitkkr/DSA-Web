/** Text highlight labels for chapters — no emoji when unclear */

const RULES: { test: RegExp; label: string; bg: string; fg: string }[] = [
  { test: /stack|queue/i, label: 'STACK & QUEUE', bg: '#dcfce7', fg: '#0d4429' },
  { test: /array/i, label: 'ARRAYS', bg: '#dbeafe', fg: '#1e40af' },
  { test: /binary search/i, label: 'BINARY SEARCH', bg: '#ede9fe', fg: '#5b21b6' },
  { test: /string/i, label: 'STRINGS', bg: '#fce7f3', fg: '#9d174d' },
  { test: /linked/i, label: 'LINKED LIST', bg: '#cffafe', fg: '#0e7490' },
  { test: /recursion/i, label: 'RECURSION', bg: '#fef3c7', fg: '#92400e' },
  { test: /bit/i, label: 'BIT MANIP', bg: '#f3e8ff', fg: '#6b21a8' },
  { test: /sliding|two pointer/i, label: 'SLIDING WINDOW', bg: '#ffedd5', fg: '#c2410c' },
  { test: /heap/i, label: 'HEAPS', bg: '#ecfccb', fg: '#3f6212' },
  { test: /greedy/i, label: 'GREEDY', bg: '#fef9c3', fg: '#a16207' },
  { test: /binary tree/i, label: 'BINARY TREES', bg: '#d1fae5', fg: '#065f46' },
  { test: /bst|search tree/i, label: 'BST', bg: '#e0e7ff', fg: '#3730a3' },
  { test: /graph/i, label: 'GRAPHS', bg: '#fee2e2', fg: '#991b1b' },
  { test: /dynamic|dp/i, label: 'DP', bg: '#fae8ff', fg: '#86198f' },
  { test: /sort/i, label: 'SORTING', bg: '#f1f5f9', fg: '#334155' },
  { test: /basic|learn/i, label: 'BASICS', bg: '#e8f5e9', fg: '#0d4429' },
];

export function getChapterLabel(title: string) {
  for (const rule of RULES) {
    if (rule.test.test(title)) return { label: rule.label, bg: rule.bg, fg: rule.fg };
  }
  const clean = title.replace(/\[.*?\]/g, '').trim();
  const words = clean.split(/\s+/).slice(0, 2).join(' ').toUpperCase();
  return {
    label: words.slice(0, 16) || 'TOPIC',
    bg: '#f1f5f9',
    fg: '#334155',
  };
}
