import { Tooltip } from 'antd';
import {
  ExpandOutlined, PlayCircleFilled, PauseCircleFilled,
  MailOutlined, TeamOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { NAV_EMOJI } from '../../lib/chapterEmojis';
import type { LastVisitedProblem } from '../../lib/api';

interface Props {
  coins: number;
  timerLabel: string;
  timerRunning: boolean;
  onPlay: () => void;
  onStop: () => void;
  progressPct: number;
  completed: number;
  total: number;
  badges: number;
  favorites: number;
  activeLabel: string;
  calendar: { date: string; level: number }[];
  focusPeak: number;
  lastVisited: LastVisitedProblem | null;
  remindersOn: boolean;
  isSticky: boolean;
  onExpand: () => void;
}

function DockChip({
  emoji, value, title, onClick, mono,
}: {
  emoji?: string;
  value: string | number;
  title?: string;
  onClick?: () => void;
  mono?: boolean;
}) {
  const inner = (
    <>
      {emoji && <span className="dash-dock-emoji">{emoji}</span>}
      <span className={`dash-dock-val${mono ? ' mono' : ''}`}>{value}</span>
    </>
  );
  if (onClick) {
    return (
      <Tooltip title={title}>
        <button type="button" className="dash-dock-chip" onClick={onClick}>{inner}</button>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={title}>
      <span className="dash-dock-chip static">{inner}</span>
    </Tooltip>
  );
}

export default function DashboardTray({
  coins, timerLabel, timerRunning, onPlay, onStop,
  progressPct, completed, total, badges, favorites,
  activeLabel, calendar, focusPeak, lastVisited, remindersOn,
  isSticky, onExpand,
}: Props) {
  const navigate = useNavigate();
  const recent = calendar.slice(-12);

  return (
    <div className="dash-dock-anchor">
      {isSticky && <div className="dash-dock-spacer" aria-hidden />}
      <div className={`dash-dock-wrap${isSticky ? ' is-sticky' : ''}`} aria-label="Dashboard dock">
        <div className="dash-dock">
          <div className="dash-dock-group">
            <DockChip emoji={NAV_EMOJI.coins} value={coins} title="Coins" onClick={() => navigate('/wallet')} />
            <div className="dash-dock-chip dash-dock-timer">
              <span className="dash-dock-emoji">{NAV_EMOJI.timer}</span>
              <span className="dash-dock-val mono">{timerLabel}</span>
              <button
                type="button"
                className="dash-dock-play"
                onClick={timerRunning ? onStop : onPlay}
                aria-label={timerRunning ? 'Stop' : 'Play'}
              >
                {timerRunning ? <PauseCircleFilled /> : <PlayCircleFilled />}
              </button>
            </div>
            <DockChip emoji={NAV_EMOJI.progress} value={`${progressPct}%`} title={`${completed}/${total} solved`} />
            <DockChip emoji={NAV_EMOJI.badges} value={badges} title="Badges earned" />
            <DockChip emoji={NAV_EMOJI.favorite} value={favorites} title="Favorites" onClick={() => navigate('/favorites')} />
          </div>

          <span className="dash-dock-divider" aria-hidden />

          <div className="dash-dock-group dash-dock-group-secondary">
            <DockChip value={activeLabel} title="Active time" mono />
            <div className="dash-dock-activity" aria-hidden>
              {recent.map((d) => (
                <span key={d.date} className={`dash-dock-dot ${d.level ? `l${Math.min(d.level, 3)}` : ''}`} />
              ))}
            </div>
            {lastVisited && (
              <Tooltip title={lastVisited.title}>
                <button
                  type="button"
                  className="dash-dock-chip dash-dock-resume"
                  onClick={() => navigate(`/problem/${lastVisited.slug}`)}
                >
                  <ArrowRightOutlined />
                  <span className="dash-dock-resume-title">{lastVisited.title}</span>
                </button>
              </Tooltip>
            )}
            <span className="dash-dock-status">
              {remindersOn && <MailOutlined title="Alerts on" />}
              <TeamOutlined title="Collab" />
              {focusPeak > 0 && <em>{focusPeak}m</em>}
            </span>
          </div>

          <button type="button" className="dash-dock-expand" onClick={onExpand} title="Open control panel">
            <ExpandOutlined />
            <span>Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
