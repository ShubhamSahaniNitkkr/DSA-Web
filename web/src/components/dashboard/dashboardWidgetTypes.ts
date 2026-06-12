import type { Dayjs } from 'dayjs';
import type { Badge, LastVisitedProblem, TopicCard } from '../../lib/api';
import type { WidgetId } from '../../lib/dashboardWidgets';

export interface DashboardWidgetCtx {
  coins: number;
  timerFormatted: string;
  timerRunning: boolean;
  onTimerPlay: () => void;
  onTimerStop: () => void;
  onTimerReset: () => void;
  completed: number;
  total: number;
  progressPct: number;
  problemsLeft: number;
  badgeCount: number;
  badgeEmoji: string;
  favCount: number;
  sessionSec: number;
  displayActiveLabel: string;
  solveTimeLabel: string;
  lastSessionLabel: string;
  calendar: { date: string; level: number }[];
  consistency: { label: string; focusMinutes: number; active: boolean }[];
  maxBar: number;
  focusPeak: number;
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailValid: boolean;
  remindEmail: boolean;
  setRemindEmail: (v: boolean) => void;
  reminderTimes: string[];
  reminderDays: number[];
  setReminderDays: (days: number[]) => void;
  pickTime: Dayjs;
  setPickTime: (v: Dayjs) => void;
  addReminderTime: () => void;
  removeReminderTime: (t: string) => void;
  saveEmailPrefs: () => void;
  saving: boolean;
  sheet: TopicCard[];
  userEmail?: string;
  lastVisited: LastVisitedProblem | null;
  onWallet: () => void;
  onFavorites: () => void;
  onBadgesOpen: () => void;
  onResume: (slug: string) => void;
  onBrowse: () => void;
  onExpandPanel: () => void;
  fmtRelative: (iso: string) => string;
  fmtMin: (sec: number) => string;
  formatHMS: (sec: number) => string;
}

export type WidgetContentProps = {
  id: WidgetId;
  variant: 'full' | 'compact';
  ctx: DashboardWidgetCtx;
};
