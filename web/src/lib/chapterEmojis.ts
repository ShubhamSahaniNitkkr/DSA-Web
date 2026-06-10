/** Chapter emoji map — matched by topic title keywords */

const RULES: { test: RegExp; emoji: string }[] = [
  { test: /learn.*basic|input output|fundamental/i, emoji: '🌱' },
  { test: /sort/i, emoji: '🔀' },
  { test: /array/i, emoji: '📊' },
  { test: /binary search/i, emoji: '🔍' },
  { test: /string/i, emoji: '🔤' },
  { test: /linked/i, emoji: '🔗' },
  { test: /recursion/i, emoji: '🔄' },
  { test: /bit/i, emoji: '⚡' },
  { test: /stack|queue/i, emoji: '📚' },
  { test: /sliding|two pointer/i, emoji: '👆' },
  { test: /heap/i, emoji: '🏔️' },
  { test: /greedy/i, emoji: '💎' },
  { test: /binary tree/i, emoji: '🌳' },
  { test: /bst|search tree/i, emoji: '🎯' },
  { test: /graph/i, emoji: '🕸️' },
  { test: /dynamic|dp/i, emoji: '🧩' },
  { test: /trie/i, emoji: '🌐' },
  { test: /math|number/i, emoji: '🔢' },
];

export function getChapterEmoji(title: string): string {
  for (const { test, emoji } of RULES) {
    if (test.test(title)) return emoji;
  }
  return '📗';
}

export const NAV_EMOJI = {
  dashboard: '✨',
  chapters: '📖',
  wallet: '💰',
  admin: '⚙️',
  timer: '⏳',
  progress: '📈',
  activity: '🗓️',
  focus: '🎯',
  reminders: '🔔',
  collab: '🤝',
  badges: '🏅',
  coins: '💎',
  solved: '✅',
  favorite: '⭐',
  like: '👍',
  dislike: '👎',
  notes: '📝',
  video: '🎬',
  links: '🔗',
  statement: '📋',
  examples: '💡',
  brute: '🐢',
  optimal: '🚀',
  ide: '⌨️',
  solution: '📚',
} as const;
