import { useEffect, useState, useMemo } from 'react';
import { message, Modal } from 'antd';
import DashboardTray from './DashboardTray';
import DashboardControlPanel from './DashboardControlPanel';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { api, type Badge, type TopicCard, type LastVisitedProblem } from '../../lib/api';
import BadgeShareCard from './BadgeShareCard';
import { NAV_EMOJI } from '../../lib/chapterEmojis';
import { formatHMS } from '../../hooks/useStopwatch';
import type { DashboardWidgetCtx } from './dashboardWidgetTypes';

interface Props {
  userName: string;
  userEmail?: string;
  coins: number;
  completed: number;
  total: number;
  consistency: { label: string; focusMinutes: number; active: boolean }[];
  calendar: { date: string; level: number }[];
  earnedBadges?: Badge[];
  badgeCatalog?: Badge[];
  avatarData?: string;
  sheet?: TopicCard[];
  emailReminders?: boolean;
  reminderTimes?: string[];
  reminderDays?: number[];
  onPrefsSaved?: () => void;
  onAvatarSaved?: () => void;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function fmtMin(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function BentoDashboard({
  userName, userEmail, coins, completed, total, consistency, calendar,
  earnedBadges = [], badgeCatalog = [], avatarData, sheet = [],
  emailReminders, reminderTimes: initTimes, reminderDays: initDays,
  onPrefsSaved, onAvatarSaved,
}: Props) {
  const navigate = useNavigate();
  const timer = useTimeTracker('active');
  const layout = useDashboardLayout();
  const [remindEmail, setRemindEmail] = useState(emailReminders ?? false);
  const [emailInput, setEmailInput] = useState(userEmail ?? '');
  const [reminderTimes, setReminderTimes] = useState<string[]>(initTimes?.length ? initTimes : ['09:00']);
  const [reminderDays, setReminderDays] = useState<number[]>(initDays?.length ? initDays : [1, 2, 3, 4, 5]);
  const [pickTime, setPickTime] = useState(dayjs('09:00', 'HH:mm'));
  const [saving, setSaving] = useState(false);
  const emailValid = useMemo(() => isValidEmail(emailInput), [emailInput]);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [lastVisited, setLastVisited] = useState<LastVisitedProblem | null>(null);
  const [timeStats, setTimeStats] = useState({ totalActiveSeconds: 0, totalSolveSeconds: 0, lastSessionSeconds: 0 });
  const [trayMinimized, setTrayMinimized] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('ss_dash_tray');
    if (saved === null) return true;
    return saved === '1';
  });
  const maxBar = Math.max(...consistency.map((c) => c.focusMinutes), 1);
  const focusPeak = Math.max(...consistency.map((c) => c.focusMinutes), 0);

  useEffect(() => {
    localStorage.setItem('ss_dash_tray', trayMinimized ? '1' : '0');
    document.body.classList.toggle('dash-dock-mode', trayMinimized);
    if (!trayMinimized) layout.setEditMode(false);
    return () => document.body.classList.remove('dash-dock-mode');
  }, [trayMinimized]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setEmailInput(userEmail ?? ''); }, [userEmail]);
  useEffect(() => { setRemindEmail(emailReminders ?? false); }, [emailReminders]);
  useEffect(() => { if (initTimes?.length) setReminderTimes(initTimes); }, [initTimes]);
  useEffect(() => { if (initDays?.length) setReminderDays(initDays); }, [initDays]);
  useEffect(() => {
    if (!emailValid && remindEmail) setRemindEmail(false);
  }, [emailValid, remindEmail]);
  useEffect(() => {
    api.getFavorites().then((r) => setFavCount(r.favorites.length)).catch(() => {});
    api.getLastVisited().then((r) => setLastVisited(r.lastVisited)).catch(() => {});
  }, []);

  useEffect(() => {
    api.getTimeStats().then((r) => setTimeStats(r.stats)).catch(() => {});
  }, [timer.seconds]);

  const sessionSec = timer.seconds;
  const displayActive = timeStats.totalActiveSeconds + (timer.running ? sessionSec : 0);
  const progressPct = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const problemsLeft = Math.max(0, total - completed);

  const addReminderTime = () => {
    if (!pickTime) return;
    const t = pickTime.format('HH:mm');
    if (reminderTimes.includes(t)) {
      message.info('That time is already added');
      return;
    }
    setReminderTimes((prev) => [...prev, t].sort());
  };

  const removeReminderTime = (t: string) => {
    setReminderTimes((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== t)));
  };

  const saveEmailPrefs = async () => {
    if (!emailValid) {
      message.warning('Enter a valid email address');
      return;
    }
    if (remindEmail && (!reminderTimes.length || !reminderDays.length)) {
      message.warning('Pick at least one time and one day');
      return;
    }
    setSaving(true);
    try {
      await api.updatePreferences({
        email: emailInput.trim(),
        emailReminders: remindEmail,
        reminderTimes,
        reminderDays,
      });
      message.success('Email alert preferences saved');
      onPrefsSaved?.();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const widgetCtx: DashboardWidgetCtx = {
    coins,
    timerFormatted: timer.formatted,
    timerRunning: timer.running,
    onTimerPlay: timer.play,
    onTimerStop: timer.stop,
    onTimerReset: timer.reset,
    completed,
    total,
    progressPct,
    problemsLeft,
    badgeCount: earnedBadges.length,
    badgeEmoji: earnedBadges[0]?.emoji || NAV_EMOJI.badges,
    favCount,
    sessionSec,
    displayActiveLabel: fmtMin(displayActive),
    solveTimeLabel: fmtMin(timeStats.totalSolveSeconds),
    lastSessionLabel: fmtMin(timeStats.lastSessionSeconds),
    calendar,
    consistency,
    maxBar,
    focusPeak,
    emailInput,
    setEmailInput,
    emailValid,
    remindEmail,
    setRemindEmail,
    reminderTimes,
    reminderDays,
    setReminderDays,
    pickTime,
    setPickTime,
    addReminderTime,
    removeReminderTime,
    saveEmailPrefs,
    saving,
    sheet,
    userEmail,
    lastVisited,
    onWallet: () => navigate('/wallet'),
    onFavorites: () => navigate('/favorites'),
    onBadgesOpen: () => setBadgeModalOpen(true),
    onResume: (slug) => navigate(`/problem/${slug}`),
    onBrowse: () => navigate('/#topics-sheet'),
    onExpandPanel: () => setTrayMinimized(false),
    fmtRelative,
    fmtMin,
    formatHMS,
  };

  return (
    <>
      {trayMinimized ? (
        <DashboardTray
          order={layout.order}
          widgetCtx={widgetCtx}
          onExpand={() => setTrayMinimized(false)}
        />
      ) : (
        <DashboardControlPanel
          layout={layout}
          widgetCtx={widgetCtx}
          onCollapse={() => setTrayMinimized(true)}
        />
      )}

      <Modal
        title={`${NAV_EMOJI.badges} Badges & Share`}
        open={badgeModalOpen}
        onCancel={() => setBadgeModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
        className="badge-share-modal"
      >
        <BadgeShareCard
          embedded
          userName={userName}
          earnedBadges={earnedBadges}
          badgeCatalog={badgeCatalog}
          avatarData={avatarData}
          onAvatarSaved={onAvatarSaved}
        />
      </Modal>
    </>
  );
}
