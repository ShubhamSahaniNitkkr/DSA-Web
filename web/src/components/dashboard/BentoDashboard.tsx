import { useEffect, useState, useMemo } from 'react';
import { Switch, Button, Input, message, Modal, TimePicker, Checkbox } from 'antd';
import { RightOutlined, PlusOutlined, SaveOutlined, PlayCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { api, type Badge, type TopicCard, type LastVisitedProblem } from '../../lib/api';
import { formatMoney } from '../ui/CoinCounter';
import ActivityCalendar from '../ui/ActivityCalendar';
import DonutChart from '../ui/DonutChart';
import BadgeShareCard from './BadgeShareCard';
import TimerControls from '../ui/TimerControls';
import CollabPanel from '../ui/CollabPanel';
import { NAV_EMOJI } from '../../lib/chapterEmojis';
import { cardThemeStyle, cardThemeClass } from '../../lib/cardThemes';
import { formatHMS } from '../../hooks/useStopwatch';

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

const DAY_OPTS = [
  { value: 0, label: 'S', full: 'Sun' },
  { value: 1, label: 'M', full: 'Mon' },
  { value: 2, label: 'T', full: 'Tue' },
  { value: 3, label: 'W', full: 'Wed' },
  { value: 4, label: 'T', full: 'Thu' },
  { value: 5, label: 'F', full: 'Fri' },
  { value: 6, label: 'S', full: 'Sat' },
];

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
  const maxBar = Math.max(...consistency.map((c) => c.focusMinutes), 1);

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

  return (
    <>
      <div className="dash-masonry dash-masonry-ios">
        <button
          type="button"
          className={`glass-card dash-tint-card dash-card-coins dash-card-clickable ${cardThemeClass('coins')}`}
          style={cardThemeStyle('coins')}
          onClick={() => navigate('/wallet')}
        >
          <span className="dash-click-hint"><RightOutlined /></span>
          <div className="dash-stat-inner">
            <span className="card-emoji">{NAV_EMOJI.coins}</span>
            <span className="dash-stat-val">{coins}</span>
            <span className="dash-stat-lbl">Coins</span>
          </div>
        </button>

        <div className={`glass-card dash-tint-card dash-card-timer dash-card-static dash-card-timer-wide ${cardThemeClass('timer')} ${timer.running ? 'on' : ''}`} style={cardThemeStyle('timer')}>
          <div className="card-head compact"><span className="card-emoji">{NAV_EMOJI.timer}</span><h3>Session timer</h3></div>
          <div className="dash-timer-val mono">{timer.formatted}</div>
          <TimerControls running={timer.running} onPlay={timer.play} onStop={timer.stop} onReset={timer.reset} />
        </div>

        <div className={`glass-card dash-tint-card dash-card-progress dash-card-static ${cardThemeClass('progress')}`} style={cardThemeStyle('progress')}>
          <div className="card-head compact"><span className="card-emoji">{NAV_EMOJI.progress}</span><h3>Progress</h3></div>
          <div className="progress-card-inner">
            <div className="progress-ring-wrap">
              <DonutChart value={completed} total={total || 1} size={78} />
            </div>
            <div className="progress-stats-row">
              <span className="progress-fraction">
                {completed}<span className="progress-total">/{total}</span>
              </span>
              <span className="progress-caption">solved</span>
            </div>
            <div className="progress-bar-mini" aria-hidden>
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.max(progressPct, progressPct > 0 ? 4 : 0)}%` }}
              />
            </div>
            <p className="progress-remaining">{problemsLeft} left to go</p>
          </div>
        </div>

        <button
          type="button"
          className={`glass-card dash-tint-card dash-card-badges dash-card-clickable ${cardThemeClass('badges')}`}
          style={cardThemeStyle('badges')}
          onClick={() => setBadgeModalOpen(true)}
        >
          <span className="dash-click-hint"><RightOutlined /></span>
          <div className="dash-stat-inner">
            <span className="card-emoji">{earnedBadges[0]?.emoji || NAV_EMOJI.badges}</span>
            <span className="dash-stat-val">{earnedBadges.length}</span>
            <span className="dash-stat-lbl">Badges</span>
          </div>
        </button>

        <button
          type="button"
          className={`glass-card dash-tint-card dash-card-favorites dash-card-clickable ${cardThemeClass('favorites')}`}
          style={cardThemeStyle('favorites')}
          onClick={() => navigate('/favorites')}
        >
          <span className="dash-click-hint"><RightOutlined /></span>
          <div className="dash-stat-inner">
            <span className="card-emoji">{NAV_EMOJI.favorite}</span>
            <span className="dash-stat-val">{favCount}</span>
            <span className="dash-stat-lbl">Favorites</span>
          </div>
        </button>

        <div className={`glass-card dash-tint-card dash-card-time dash-card-static dash-card-time-wide ${cardThemeClass('time')}`} style={cardThemeStyle('time')}>
          <div className="card-head compact"><span className="card-emoji">⏱</span><h3>Time tracked</h3></div>
          <div className="time-stat-grid time-stat-grid-premium">
            <div className="time-pill session">
              <span className="time-pill-icon">⏳</span>
              <div><small>Session</small><strong className="mono">{formatHMS(sessionSec)}</strong></div>
            </div>
            <div className="time-pill active">
              <span className="time-pill-icon">🟢</span>
              <div><small>Active</small><strong>{fmtMin(displayActive)}</strong></div>
            </div>
            <div className="time-pill solving">
              <span className="time-pill-icon">🧠</span>
              <div><small>Solving</small><strong>{fmtMin(timeStats.totalSolveSeconds)}</strong></div>
            </div>
            <div className="time-pill last">
              <span className="time-pill-icon">📌</span>
              <div><small>Last session</small><strong>{fmtMin(timeStats.lastSessionSeconds)}</strong></div>
            </div>
          </div>
        </div>

        <div className={`glass-card dash-tint-card dash-card-activity dash-card-static ${cardThemeClass('activity')}`} style={cardThemeStyle('activity')}>
          <div className="card-head"><span className="card-emoji">{NAV_EMOJI.activity}</span><h3>Activity</h3></div>
          <ActivityCalendar data={calendar} months={3} />
        </div>

        <div className={`glass-card dash-tint-card dash-card-focus dash-card-static ${cardThemeClass('focus')}`} style={cardThemeStyle('focus')}>
          <div className="card-head"><span className="card-emoji">{NAV_EMOJI.focus}</span><h3>Focus</h3></div>
          <div className="bento-bars">
            {consistency.map((day, i) => {
              const h = Math.max((day.focusMinutes / maxBar) * 90, 8);
              const cls = day.focusMinutes === 0 ? 'striped' : ['solid', 'medium', 'light'][i % 3];
              return (
                <div key={day.label} className="bento-bar-col">
                  <div className={`dz-bar ${cls}`} style={{ height: h }} />
                  <span>{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`glass-card dash-tint-card dash-card-email dash-card-static dash-card-action ${cardThemeClass('email')}`} style={cardThemeStyle('email')}>
          <div className="card-head"><span className="card-emoji">{NAV_EMOJI.reminders}</span><h3>Email alerts</h3></div>
          <p className="card-desc">Practice nudges on your schedule</p>

          <label className="email-field-label" htmlFor="alert-email">Email</label>
          <Input
            id="alert-email"
            type="email"
            placeholder="you@email.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={`email-input-field ${emailValid ? 'valid' : emailInput.trim() ? 'invalid' : ''}`}
            status={emailInput.trim() && !emailValid ? 'error' : undefined}
          />
          {emailInput.trim() && !emailValid && (
            <p className="email-field-hint error">Enter a valid email to enable reminders</p>
          )}

          <div className="email-schedule-block">
            <span className="email-field-label">Reminder times</span>
            <div className="email-time-row">
              <TimePicker
                value={pickTime}
                onChange={(v) => v && setPickTime(v)}
                format="HH:mm"
                minuteStep={15}
                needConfirm={false}
                className="email-time-picker"
                disabled={!emailValid}
              />
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={addReminderTime}
                disabled={!emailValid}
                className="email-add-time-btn"
              >
                Add
              </Button>
            </div>
            <div className="email-time-chips">
              {reminderTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="email-time-chip"
                  onClick={() => removeReminderTime(t)}
                  disabled={!emailValid || reminderTimes.length <= 1}
                  title={reminderTimes.length <= 1 ? 'Keep at least one time' : 'Remove time'}
                >
                  {t} <span className="chip-x">×</span>
                </button>
              ))}
            </div>
          </div>

          <div className="email-schedule-block">
            <span className="email-field-label">Days</span>
            <Checkbox.Group
              className="email-days-row"
              value={reminderDays}
              onChange={(vals) => setReminderDays(vals as number[])}
              disabled={!emailValid}
            >
              {DAY_OPTS.map((d) => (
                <Checkbox key={d.value} value={d.value} className="email-day-check">
                  <span title={d.full}>{d.label}</span>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>

          <div className={`email-toggle-row ${!emailValid ? 'disabled' : ''}`}>
            <div>
              <strong>Enable reminders</strong>
              <small>{emailValid ? 'Sends on selected days & times' : 'Valid email required'}</small>
            </div>
            <Switch
              checked={remindEmail}
              onChange={setRemindEmail}
              disabled={!emailValid}
            />
          </div>

          <Button
            type="primary"
            block
            icon={<SaveOutlined />}
            loading={saving}
            className="dash-email-save-btn"
            onClick={saveEmailPrefs}
            disabled={!emailValid}
          >
            Save
          </Button>
        </div>

        <div className="dash-right-stack">
          <div className={`glass-card dash-tint-card dash-card-collab dash-card-static dash-card-action dash-card-half ${cardThemeClass('collab')}`} style={cardThemeStyle('collab')}>
            <div className="card-head"><span className="card-emoji">{NAV_EMOJI.collab}</span><h3>Collab</h3></div>
            <p className="card-desc">Race friends on any problem</p>
            <CollabPanel sheet={sheet} compact />
          </div>

          <div className={`glass-card dash-tint-card dash-card-resume dash-card-static dash-card-action dash-card-half ${cardThemeClass('resume')}`} style={cardThemeStyle('resume')}>
            <div className="card-head"><span className="card-emoji">📍</span><h3>Continue</h3></div>
            {lastVisited ? (
              <div className="resume-card-body">
                <p className="resume-problem-title" title={lastVisited.title}>{lastVisited.title}</p>
                <p className="resume-problem-meta">
                  {lastVisited.topic}{lastVisited.difficulty ? ` · ${lastVisited.difficulty}` : ''}
                </p>
                <div className="resume-time-row">
                  <span><small>Visited</small><strong>{fmtRelative(lastVisited.lastOpenedAt)}</strong></span>
                  <span><small>Invested</small><strong>{fmtMin(lastVisited.totalTimeSeconds)}</strong></span>
                </div>
                <Button
                  type="primary"
                  block
                  icon={<PlayCircleOutlined />}
                  className="resume-continue-btn"
                  onClick={() => navigate(`/problem/${lastVisited.slug}`)}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="resume-card-empty">
                <p>Open any problem — your last session shows up here with time tracked.</p>
                <Button block className="resume-continue-btn ghost" onClick={() => navigate('/#topics-sheet')}>
                  Browse problems
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal title={`${NAV_EMOJI.badges} Badges & Share`} open={badgeModalOpen} onCancel={() => setBadgeModalOpen(false)} footer={null} width={720} destroyOnClose className="badge-share-modal">
        <BadgeShareCard embedded userName={userName} earnedBadges={earnedBadges} badgeCatalog={badgeCatalog} avatarData={avatarData} onAvatarSaved={onAvatarSaved} />
      </Modal>

    </>
  );
}
