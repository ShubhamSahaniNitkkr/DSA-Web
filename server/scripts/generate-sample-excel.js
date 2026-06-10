import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', '..', 'docs');
mkdirSync(outDir, { recursive: true });

const topics = [
  { chapterOrder: 1, title: 'Arrays & Hashing', slug: 'arrays-hashing', description: 'Start here — hash maps, frequency counts, two-sum patterns', icon: '▣', accentColor: '#d97757' },
  { chapterOrder: 2, title: 'Two Pointers', slug: 'two-pointers', description: 'Sliding window and sorted-array tricks', icon: '⇄', accentColor: '#5b8a72' },
];

const problems = [
  { topicSlug: 'arrays-hashing', title: 'Two Sum', slug: 'two-sum', subtopic: 'Hash Map Lookup', difficulty: 'Easy', companies: 'Google, Amazon', problemOrder: 1, youtube: 'https://www.youtube.com/watch?v=KLlXBG05nig', leetcode: 'https://leetcode.com/problems/two-sum/', codeforces: '', article: 'https://www.geeksforgeeks.org/check-if-pair-with-given-sum-exists-in-array/', affiliateLink: 'https://amzn.to/example-dsa-book', starterCode: 'function solve(input) {\n  return [0, 1];\n}' },
  { topicSlug: 'arrays-hashing', title: 'Contains Duplicate', slug: 'contains-duplicate', subtopic: 'Hash Set Basics', difficulty: 'Easy', companies: 'Flipkart, Microsoft', problemOrder: 2, youtube: 'https://www.youtube.com/watch?v=3OamzN90kQ0', leetcode: 'https://leetcode.com/problems/contains-duplicate/', codeforces: '', article: 'https://www.geeksforgeeks.org/check-if-a-array-contains-duplicates/', affiliateLink: '', starterCode: 'function solve(nums) {\n  return false;\n}' },
  { topicSlug: 'two-pointers', title: 'Valid Palindrome', slug: 'valid-palindrome', subtopic: 'Two Pointer Basics', difficulty: 'Easy', companies: 'Meta', problemOrder: 1, youtube: 'https://www.youtube.com/watch?v=jJXJ16kPFWg', leetcode: 'https://leetcode.com/problems/valid-palindrome/', codeforces: '', article: 'https://www.geeksforgeeks.org/check-if-a-string-is-palindrome-or-not/', affiliateLink: '', starterCode: 'function solve(s) {\n  return true;\n}' },
];

const quiz = [
  { problemSlug: 'two-sum', question: 'Best auxiliary structure for Two Sum in one pass?', option1: 'Stack', option2: 'Hash Map', option3: 'Queue', option4: 'Heap', correctIndex: 1, order: 1 },
  { problemSlug: 'two-sum', question: 'Typical time complexity for optimal Two Sum?', option1: 'O(n²)', option2: 'O(n log n)', option3: 'O(n)', option4: 'O(1)', correctIndex: 2, order: 2 },
  { problemSlug: 'contains-duplicate', question: 'Contains Duplicate uses a ___ for O(n) time', option1: 'Hash Set', option2: 'BST only', option3: 'Graph', option4: 'Stack', correctIndex: 0, order: 1 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topics), 'Topics');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(problems), 'Problems');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quiz), 'Quiz');

const outPath = join(outDir, 'sample-sheetstack-content.xlsx');
writeFileSync(outPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
console.log('Sample Excel created:', outPath);
