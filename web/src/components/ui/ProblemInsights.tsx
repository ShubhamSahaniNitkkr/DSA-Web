import {
  ClockCircleOutlined, ThunderboltOutlined, TeamOutlined, UserOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import type { ProblemInsightsData } from '../../lib/api';

function fmtDuration(sec: number) {
  if (!sec || sec < 1) return '—';
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

interface Props {
  insights: ProblemInsightsData | null;
}

export default function ProblemInsights({ insights }: Props) {
  if (!insights) return null;

  const you = insights.you;
  const hasYou = you?.lastAttemptedAt || (you?.lastSessionSeconds ?? 0) > 0 || (you?.totalTimeSeconds ?? 0) > 0;

  return (
    <div className="problem-insights">
      {insights.demo && <p className="demo-hint">Sample community stats — real data appears as users solve</p>}

      {hasYou && (
        <>
          <p className="insights-section-label">Your stats</p>
          <div className="problem-insights-grid you-row">
            <div className="problem-insight-card you">
              <span className="insight-icon"><UserOutlined /></span>
              <div className="insight-body">
                <small>Your last attempt</small>
                <strong>{you.lastAttemptedAt ? fmtRelative(you.lastAttemptedAt) : '—'}</strong>
                {you.attemptCount > 0 && (
                  <span className="insight-meta">{you.attemptCount} visit{you.attemptCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>

            <div className="problem-insight-card you">
              <span className="insight-icon"><FieldTimeOutlined /></span>
              <div className="insight-body">
                <small>Last session time</small>
                <strong>{fmtDuration(you.lastSessionSeconds)}</strong>
                <span className="insight-meta">on this problem</span>
              </div>
            </div>

            <div className="problem-insight-card you">
              <span className="insight-icon"><ClockCircleOutlined /></span>
              <div className="insight-body">
                <small>Your total time</small>
                <strong>{fmtDuration(you.totalTimeSeconds)}</strong>
                <span className="insight-meta">all sessions</span>
              </div>
            </div>
          </div>
        </>
      )}

      <p className="insights-section-label">Community</p>
      <div className="problem-insights-grid">
        <div className="problem-insight-card">
          <span className="insight-icon"><ClockCircleOutlined /></span>
          <div className="insight-body">
            <small>Last attempted by</small>
            <strong>
              {insights.lastAttempted?.isYou ? 'You' : (insights.lastAttempted?.name || '—')}
            </strong>
            {insights.lastAttempted?.at && (
              <span className="insight-meta">{fmtRelative(insights.lastAttempted.at)}</span>
            )}
          </div>
        </div>

        <div className="problem-insight-card highlight">
          <span className="insight-icon"><ThunderboltOutlined /></span>
          <div className="insight-body">
            <small>Fastest solve</small>
            <strong>
              {insights.fastestSolver?.isYou ? 'You' : (insights.fastestSolver?.name || '—')}
            </strong>
            {insights.fastestSolver && (
              <span className="insight-meta">{fmtDuration(insights.fastestSolver.timeSeconds)} total</span>
            )}
          </div>
        </div>

        <div className="problem-insight-card">
          <span className="insight-icon"><TeamOutlined /></span>
          <div className="insight-body">
            <small>Total solvers</small>
            <strong>{insights.totalSolvers}</strong>
            <span className="insight-meta">completed this problem</span>
          </div>
        </div>
      </div>
    </div>
  );
}
