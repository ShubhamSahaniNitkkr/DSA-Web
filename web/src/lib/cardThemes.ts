import type { CSSProperties } from 'react';

/** Accent tints — glass base shows through; no opaque fills */
export const DASH_CARD_THEMES = {
  coins: { border: 'rgba(251,191,36,0.45)', accent: '#b45309', tint: 'rgba(251,191,36,0.12)' },
  timer: { border: 'rgba(52,211,153,0.45)', accent: '#0d4429', tint: 'rgba(52,211,153,0.12)' },
  progress: { border: 'rgba(96,165,250,0.45)', accent: '#1d4ed8', tint: 'rgba(96,165,250,0.12)' },
  badges: { border: 'rgba(192,132,252,0.45)', accent: '#7c3aed', tint: 'rgba(192,132,252,0.12)' },
  time: { border: 'rgba(45,212,191,0.45)', accent: '#0f766e', tint: 'rgba(45,212,191,0.12)' },
  activity: { border: 'rgba(56,189,248,0.4)', accent: '#0369a1', tint: 'rgba(56,189,248,0.1)' },
  focus: { border: 'rgba(248,113,113,0.4)', accent: '#be123c', tint: 'rgba(248,113,113,0.1)' },
  email: { border: 'rgba(251,146,60,0.4)', accent: '#c2410c', tint: 'rgba(251,146,60,0.1)' },
  collab: { border: 'rgba(129,140,248,0.4)', accent: '#4338ca', tint: 'rgba(129,140,248,0.1)' },
  resume: { border: 'rgba(16,185,129,0.4)', accent: '#047857', tint: 'rgba(16,185,129,0.1)' },
  favorites: { border: 'rgba(234,179,8,0.45)', accent: '#a16207', tint: 'rgba(234,179,8,0.12)' },
} as const;

export type CardThemeKey = keyof typeof DASH_CARD_THEMES;

export function cardThemeStyle(key: CardThemeKey): CSSProperties {
  const t = DASH_CARD_THEMES[key];
  return {
    ['--card-accent' as string]: t.accent,
    ['--card-tint' as string]: t.tint,
    borderColor: t.border,
  };
}

export function cardThemeClass(key: CardThemeKey) {
  return `dash-tint-${key}`;
}
