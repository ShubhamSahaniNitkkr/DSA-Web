import { Switch, Button, Input, TimePicker, Checkbox } from 'antd';
import {
  RightOutlined, PlusOutlined, SaveOutlined, PlayCircleOutlined,
  PlayCircleFilled, PauseCircleFilled,
} from '@ant-design/icons';
import ActivityCalendar from '../ui/ActivityCalendar';
import DonutChart from '../ui/DonutChart';
import TimerControls from '../ui/TimerControls';
import CollabPanel from '../ui/CollabPanel';
import { WIDGET_ICONS, type WidgetId } from '../../lib/dashboardWidgets';
import type { WidgetContentProps } from './dashboardWidgetTypes';

const DAY_OPTS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
];

function icon(id: WidgetId) {
  return WIDGET_ICONS[id];
}

function WidgetHead({ id, title }: { id: WidgetId; title: string }) {
  return (
    <div className="cp-card-head">
      <span className="cp-card-icon" aria-hidden>{icon(id)}</span>
      <h3>{title}</h3>
    </div>
  );
}

function CompactStat({
  id, label, value, onClick, mono,
}: {
  id: WidgetId;
  label: string;
  value: string | number;
  onClick?: () => void;
  mono?: boolean;
}) {
  const body = (
    <>
      <span className="cp-compact-icon-top" aria-hidden>{icon(id)}</span>
      <span className="cp-compact-val">{mono ? <span className="mono">{value}</span> : value}</span>
      <span className="cp-compact-lbl">{label}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="cp-compact-stat clickable" onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="cp-compact-stat">{body}</div>;
}

export default function DashboardWidgetContent({ id, variant, ctx }: WidgetContentProps) {
  if (variant === 'compact') return <CompactWidget id={id} ctx={ctx} />;
  return <FullWidget id={id} ctx={ctx} />;
}

function CompactWidget({ id, ctx }: { id: WidgetContentProps['id']; ctx: WidgetContentProps['ctx'] }) {
  switch (id) {
    case 'coins':
      return <CompactStat id="coins" label="Coins" value={ctx.coins} onClick={ctx.onWallet} />;
    case 'timer':
      return (
        <div className="cp-compact-stat cp-compact-timer">
          <span className="cp-compact-icon-top" aria-hidden>{icon('timer')}</span>
          <span className="cp-compact-val mono">{ctx.timerFormatted}</span>
          <span className="cp-compact-lbl">Session timer</span>
          <button
            type="button"
            className="cp-compact-play"
            onClick={ctx.timerRunning ? ctx.onTimerStop : ctx.onTimerPlay}
            aria-label={ctx.timerRunning ? 'Stop' : 'Start'}
          >
            {ctx.timerRunning ? <PauseCircleFilled /> : <PlayCircleFilled />}
          </button>
        </div>
      );
    case 'progress':
      return <CompactStat id="progress" label="Progress" value={`${ctx.progressPct}%`} />;
    case 'badges':
      return <CompactStat id="badges" label="Badges" value={ctx.badgeCount} onClick={ctx.onBadgesOpen} />;
    case 'favorites':
      return <CompactStat id="favorites" label="Favorites" value={ctx.favCount} onClick={ctx.onFavorites} />;
    case 'time':
      return <CompactStat id="time" label="Active time" value={ctx.displayActiveLabel} mono />;
    case 'activity': {
      const recent = ctx.calendar.slice(-14);
      return (
        <div className="cp-compact-stat cp-compact-activity">
          <span className="cp-compact-icon-top" aria-hidden>{icon('activity')}</span>
          <span className="cp-compact-lbl">Activity</span>
          <div className="cp-compact-dots">
            {recent.map((d) => (
              <span key={d.date} className={`cp-dot ${d.level ? `l${Math.min(d.level, 3)}` : ''}`} />
            ))}
          </div>
        </div>
      );
    }
    case 'focus':
      return <CompactStat id="focus" label="Peak focus" value={ctx.focusPeak > 0 ? `${ctx.focusPeak}m` : '—'} />;
    case 'reminders': {
      const schedule = ctx.remindEmail
        ? `${ctx.reminderTimes.length}× · ${ctx.reminderDays.length}d`
        : 'Off';
      return (
        <button type="button" className="cp-compact-stat clickable" onClick={ctx.onExpandPanel}>
          <span className="cp-compact-icon-top" aria-hidden>{icon('reminders')}</span>
          <span className="cp-compact-val">{ctx.remindEmail ? 'On' : 'Off'}</span>
          <span className="cp-compact-lbl">Reminders · {schedule}</span>
        </button>
      );
    }
    case 'collab':
      return (
        <button type="button" className="cp-compact-stat clickable" onClick={ctx.onExpandPanel}>
          <span className="cp-compact-icon-top" aria-hidden>{icon('collab')}</span>
          <span className="cp-compact-val">Invite</span>
          <span className="cp-compact-lbl">Collab</span>
        </button>
      );
    case 'resume':
      if (!ctx.lastVisited) {
        return (
          <button type="button" className="cp-compact-stat clickable" onClick={ctx.onBrowse}>
            <span className="cp-compact-icon-top" aria-hidden>{icon('resume')}</span>
            <span className="cp-compact-val">—</span>
            <span className="cp-compact-lbl">Continue</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          className="cp-compact-stat clickable cp-compact-resume"
          onClick={() => ctx.onResume(ctx.lastVisited!.slug)}
        >
          <span className="cp-compact-icon-top" aria-hidden>{icon('resume')}</span>
          <span className="cp-compact-val truncate">{ctx.lastVisited.title}</span>
          <span className="cp-compact-lbl">Continue</span>
        </button>
      );
    default:
      return null;
  }
}

function StatCard({
  id, label, value, onClick,
}: {
  id: WidgetId;
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="cp-card-icon cp-card-icon-stat" aria-hidden>{icon(id)}</span>
      <span className="cp-card-stat-val">{value}</span>
      <span className="cp-card-stat-lbl">{label}</span>
      {onClick && <RightOutlined className="cp-card-arrow" />}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="cp-card cp-card-stat clickable" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className="cp-card cp-card-stat">{inner}</div>;
}

function FullWidget({ id, ctx }: { id: WidgetContentProps['id']; ctx: WidgetContentProps['ctx'] }) {
  switch (id) {
    case 'coins':
      return <StatCard id="coins" label="Coins" value={ctx.coins} onClick={ctx.onWallet} />;
    case 'timer':
      return (
        <div className={`cp-card cp-card-timer${ctx.timerRunning ? ' on' : ''}`}>
          <WidgetHead id="timer" title="Session timer" />
          <div className="cp-timer-val mono">{ctx.timerFormatted}</div>
          <TimerControls
            running={ctx.timerRunning}
            onPlay={ctx.onTimerPlay}
            onStop={ctx.onTimerStop}
            onReset={ctx.onTimerReset}
          />
        </div>
      );
    case 'progress':
      return (
        <div className="cp-card cp-card-progress">
          <WidgetHead id="progress" title="Progress" />
          <div className="cp-progress-inner">
            <DonutChart value={ctx.completed} total={ctx.total || 1} size={56} />
            <div className="cp-progress-meta">
              <strong>{ctx.progressPct}%</strong>
              <small>{ctx.problemsLeft} left</small>
            </div>
          </div>
        </div>
      );
    case 'badges':
      return <StatCard id="badges" label="Badges" value={ctx.badgeCount} onClick={ctx.onBadgesOpen} />;
    case 'favorites':
      return <StatCard id="favorites" label="Favorites" value={ctx.favCount} onClick={ctx.onFavorites} />;
    case 'time':
      return (
        <div className="cp-card cp-card-time">
          <WidgetHead id="time" title="Time tracked" />
          <div className="cp-time-grid">
            <div><small>Session</small><strong className="mono">{ctx.formatHMS(ctx.sessionSec)}</strong></div>
            <div><small>Active</small><strong>{ctx.displayActiveLabel}</strong></div>
            <div><small>Solving</small><strong>{ctx.solveTimeLabel}</strong></div>
            <div><small>Last</small><strong>{ctx.lastSessionLabel}</strong></div>
          </div>
        </div>
      );
    case 'activity':
      return (
        <div className="cp-card cp-card-activity">
          <WidgetHead id="activity" title="Activity" />
          <div className="cp-activity-wrap">
            <ActivityCalendar data={ctx.calendar} months={2} />
          </div>
        </div>
      );
    case 'focus':
      return (
        <div className="cp-card cp-card-focus">
          <WidgetHead id="focus" title="Focus" />
          <div className="cp-focus-bars">
            {ctx.consistency.map((day, i) => {
              const h = Math.max((day.focusMinutes / ctx.maxBar) * 100, 4);
              const cls = day.focusMinutes === 0 ? 'empty' : ['a', 'b', 'c'][i % 3];
              return (
                <div key={day.label} className="cp-focus-col">
                  <div className="cp-focus-bar-track">
                    <div className={`cp-focus-bar ${cls}`} style={{ height: `${h}%` }} />
                  </div>
                  <span>{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    case 'reminders':
      return (
        <div className="cp-card cp-card-reminders">
          <WidgetHead id="reminders" title="Reminders" />
          <div className="cp-reminders-body">
            <Input
              id="alert-email"
              type="email"
              size="small"
              placeholder="Email"
              value={ctx.emailInput}
              onChange={(e) => ctx.setEmailInput(e.target.value)}
              className="dash-form-input"
              status={ctx.emailInput.trim() && !ctx.emailValid ? 'error' : undefined}
            />
            <div className="cp-reminders-row">
              <TimePicker
                size="small"
                value={ctx.pickTime}
                onChange={(v) => v && ctx.setPickTime(v)}
                format="HH:mm"
                minuteStep={15}
                needConfirm={false}
                disabled={!ctx.emailValid}
              />
              <Button size="small" icon={<PlusOutlined />} onClick={ctx.addReminderTime} disabled={!ctx.emailValid} />
              <div className="cp-chips">
                {ctx.reminderTimes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="cp-chip"
                    onClick={() => ctx.removeReminderTime(t)}
                    disabled={!ctx.emailValid || ctx.reminderTimes.length <= 1}
                  >
                    {t}×
                  </button>
                ))}
              </div>
            </div>
            <Checkbox.Group
              className="cp-days-compact"
              value={ctx.reminderDays}
              onChange={(vals) => ctx.setReminderDays(vals as number[])}
              disabled={!ctx.emailValid}
            >
              {DAY_OPTS.map((d) => (
                <Checkbox key={d.value} value={d.value}>{d.label}</Checkbox>
              ))}
            </Checkbox.Group>
            <div className="cp-reminders-foot">
              <Switch size="small" checked={ctx.remindEmail} onChange={ctx.setRemindEmail} disabled={!ctx.emailValid} />
              <span className="cp-reminders-foot-lbl">Enable</span>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={ctx.saving}
                onClick={ctx.saveEmailPrefs}
                disabled={!ctx.emailValid}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      );
    case 'collab':
      return (
        <div className="cp-card cp-card-collab">
          <WidgetHead id="collab" title="Collaboration" />
          <CollabPanel sheet={ctx.sheet} compact userEmail={ctx.userEmail} />
        </div>
      );
    case 'resume':
      return (
        <div className="cp-card cp-card-resume">
          <WidgetHead id="resume" title="Continue" />
          {ctx.lastVisited ? (
            <>
              <p className="cp-resume-title">{ctx.lastVisited.title}</p>
              <div className="cp-resume-stats">
                <span><small>Visited</small><strong>{ctx.fmtRelative(ctx.lastVisited.lastOpenedAt)}</strong></span>
                <span><small>Time</small><strong>{ctx.fmtMin(ctx.lastVisited.totalTimeSeconds)}</strong></span>
              </div>
              <Button
                type="primary"
                size="small"
                block
                icon={<PlayCircleOutlined />}
                className="dash-btn dash-btn-primary"
                onClick={() => ctx.onResume(ctx.lastVisited!.slug)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <p className="cp-card-desc">Last opened problem shows here.</p>
              <Button size="small" block className="dash-btn dash-btn-ghost" onClick={ctx.onBrowse}>
                Browse
              </Button>
            </>
          )}
        </div>
      );
    default:
      return null;
  }
}
