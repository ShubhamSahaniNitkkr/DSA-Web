import { NAV_EMOJI } from './chapterEmojis';

export type WidgetId =
  | 'coins'
  | 'timer'
  | 'progress'
  | 'badges'
  | 'favorites'
  | 'time'
  | 'activity'
  | 'focus'
  | 'reminders'
  | 'collab'
  | 'resume';

export type WidgetSize = 'sm' | 'md' | 'lg';

export interface WidgetDef {
  id: WidgetId;
  title: string;
  description: string;
  size: WidgetSize;
  defaultEnabled: boolean;
}

export const WIDGET_CATALOG: WidgetDef[] = [
  {
    id: 'coins',
    title: 'Coins',
    description: 'Shows your earned coins and opens the wallet to redeem rewards.',
    size: 'sm',
    defaultEnabled: true,
  },
  {
    id: 'timer',
    title: 'Session timer',
    description: 'Start, pause, and reset a focus timer for your current study session.',
    size: 'md',
    defaultEnabled: true,
  },
  {
    id: 'progress',
    title: 'Progress',
    description: 'Tracks how many problems you have solved out of the full sheet.',
    size: 'sm',
    defaultEnabled: true,
  },
  {
    id: 'badges',
    title: 'Badges',
    description: 'Displays earned achievement badges and opens the share gallery.',
    size: 'sm',
    defaultEnabled: true,
  },
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Quick count of bookmarked problems with a link to your favorites list.',
    size: 'sm',
    defaultEnabled: true,
  },
  {
    id: 'time',
    title: 'Time tracked',
    description: 'Breaks down session, active, solving, and last-session time on the platform.',
    size: 'md',
    defaultEnabled: true,
  },
  {
    id: 'activity',
    title: 'Activity',
    description: 'Heatmap calendar of your daily practice over the last few months.',
    size: 'md',
    defaultEnabled: true,
  },
  {
    id: 'focus',
    title: 'Focus',
    description: 'Bar chart of focus minutes per day to spot your most productive periods.',
    size: 'md',
    defaultEnabled: true,
  },
  {
    id: 'reminders',
    title: 'Email reminders',
    description: 'Schedule practice nudges by email on the days and times you choose.',
    size: 'md',
    defaultEnabled: true,
  },
  {
    id: 'collab',
    title: 'Collaboration',
    description: 'Invite a friend by email to race on the same coding problem together.',
    size: 'md',
    defaultEnabled: true,
  },
  {
    id: 'resume',
    title: 'Continue',
    description: 'Jump back into the last problem you opened, with time already tracked.',
    size: 'md',
    defaultEnabled: true,
  },
];

export const DEFAULT_WIDGET_ORDER: WidgetId[] = WIDGET_CATALOG
  .filter((w) => w.defaultEnabled)
  .map((w) => w.id);

const catalogMap = new Map(WIDGET_CATALOG.map((w) => [w.id, w]));

export function getWidgetDef(id: WidgetId): WidgetDef {
  const def = catalogMap.get(id);
  if (!def) throw new Error(`Unknown widget: ${id}`);
  return def;
}

export const LAYOUT_STORAGE_KEY = 'ss_dash_widgets_v2';

export const WIDGET_ICONS: Record<WidgetId, string> = {
  coins: NAV_EMOJI.coins,
  timer: NAV_EMOJI.timer,
  progress: NAV_EMOJI.progress,
  badges: NAV_EMOJI.badges,
  favorites: NAV_EMOJI.favorite,
  time: '⏱',
  activity: NAV_EMOJI.activity,
  focus: NAV_EMOJI.focus,
  reminders: NAV_EMOJI.reminders,
  collab: NAV_EMOJI.collab,
  resume: '📍',
};
