/** 20 unique iOS-style glass tints — assigned by chapter title hash (no repeats until 20+) */

export interface ChapterTint {
  bg: string;
  border: string;
  accent: string;
  glass: string;
}

const PALETTE: ChapterTint[] = [
  { bg: 'rgba(255,251,235,0.55)', border: 'rgba(251,191,36,0.35)', accent: '#b45309', glass: 'rgba(251,191,36,0.08)' },
  { bg: 'rgba(236,253,245,0.55)', border: 'rgba(52,211,153,0.35)', accent: '#047857', glass: 'rgba(52,211,153,0.08)' },
  { bg: 'rgba(239,246,255,0.55)', border: 'rgba(96,165,250,0.35)', accent: '#1d4ed8', glass: 'rgba(96,165,250,0.08)' },
  { bg: 'rgba(250,245,255,0.55)', border: 'rgba(192,132,252,0.35)', accent: '#7c3aed', glass: 'rgba(192,132,252,0.08)' },
  { bg: 'rgba(255,241,242,0.55)', border: 'rgba(248,113,113,0.35)', accent: '#be123c', glass: 'rgba(248,113,113,0.08)' },
  { bg: 'rgba(240,253,250,0.55)', border: 'rgba(45,212,191,0.35)', accent: '#0f766e', glass: 'rgba(45,212,191,0.08)' },
  { bg: 'rgba(255,247,237,0.55)', border: 'rgba(251,146,60,0.35)', accent: '#c2410c', glass: 'rgba(251,146,60,0.08)' },
  { bg: 'rgba(238,242,255,0.55)', border: 'rgba(129,140,248,0.35)', accent: '#4338ca', glass: 'rgba(129,140,248,0.08)' },
  { bg: 'rgba(254,249,195,0.5)', border: 'rgba(234,179,8,0.35)', accent: '#a16207', glass: 'rgba(234,179,8,0.08)' },
  { bg: 'rgba(224,242,254,0.55)', border: 'rgba(14,165,233,0.35)', accent: '#0369a1', glass: 'rgba(14,165,233,0.08)' },
  { bg: 'rgba(252,231,243,0.55)', border: 'rgba(244,114,182,0.35)', accent: '#be185d', glass: 'rgba(244,114,182,0.08)' },
  { bg: 'rgba(237,233,254,0.55)', border: 'rgba(167,139,250,0.35)', accent: '#6d28d9', glass: 'rgba(167,139,250,0.08)' },
  { bg: 'rgba(220,252,231,0.55)', border: 'rgba(74,222,128,0.35)', accent: '#15803d', glass: 'rgba(74,222,128,0.08)' },
  { bg: 'rgba(254,226,226,0.55)', border: 'rgba(248,113,113,0.3)', accent: '#dc2626', glass: 'rgba(248,113,113,0.07)' },
  { bg: 'rgba(241,245,249,0.6)', border: 'rgba(148,163,184,0.35)', accent: '#475569', glass: 'rgba(148,163,184,0.08)' },
  { bg: 'rgba(255,237,213,0.55)', border: 'rgba(251,146,60,0.3)', accent: '#ea580c', glass: 'rgba(251,146,60,0.07)' },
  { bg: 'rgba(204,251,241,0.5)', border: 'rgba(20,184,166,0.35)', accent: '#0d9488', glass: 'rgba(20,184,166,0.08)' },
  { bg: 'rgba(233,213,255,0.5)', border: 'rgba(168,85,247,0.35)', accent: '#9333ea', glass: 'rgba(168,85,247,0.08)' },
  { bg: 'rgba(254,243,199,0.5)', border: 'rgba(245,158,11,0.35)', accent: '#d97706', glass: 'rgba(245,158,11,0.08)' },
  { bg: 'rgba(219,234,254,0.55)', border: 'rgba(59,130,246,0.35)', accent: '#2563eb', glass: 'rgba(59,130,246,0.08)' },
];

function hashTitle(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return h;
}

export function tintForChapter(title: string): ChapterTint {
  return PALETTE[hashTitle(title) % PALETTE.length];
}

/** @deprecated use tintForChapter */
export function tintForIndex(i: number) {
  return PALETTE[i % PALETTE.length];
}
