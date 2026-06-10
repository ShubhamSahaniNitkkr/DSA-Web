import { useCountdown } from '../../hooks/useStopwatch';
import TimerControls from './TimerControls';

export const INTERVIEW_SECONDS = 45 * 60;

interface CountdownApi {
  remaining: number;
  running: boolean;
  expired: boolean;
  formatted: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

interface Props {
  compact?: boolean;
  countdown?: CountdownApi;
  onPlay?: () => void;
  onStop?: () => void;
  onReset?: () => void;
}

export default function ProblemTimer({ compact, countdown: external, onPlay, onStop, onReset }: Props) {
  const internal = useCountdown(INTERVIEW_SECONDS);
  const cd = external ?? internal;

  const play = () => { cd.start(); onPlay?.(); };
  const stop = () => { cd.pause(); onStop?.(); };
  const reset = () => { cd.reset(); onReset?.(); };

  if (compact) {
    return (
      <div className={`timer-compact ${cd.running ? 'on' : ''} ${cd.expired ? 'expired' : ''}`}>
        <span className="timer-compact-label">45 min interview</span>
        <span className="timer-compact-val">{cd.formatted}</span>
        <TimerControls running={cd.running} onPlay={play} onStop={stop} onReset={reset} />
      </div>
    );
  }

  return (
    <div className={`problem-timer ${cd.expired ? 'expired' : ''} ${cd.running ? 'running' : ''}`}>
      <div>
        <div className="problem-timer-label">Interview Timer</div>
        <div className="problem-timer-value">{cd.formatted}</div>
        <div className="problem-timer-hint">45-minute interview simulation</div>
      </div>
      <TimerControls
        running={cd.running}
        onPlay={play}
        onStop={stop}
        onReset={reset}
      />
    </div>
  );
}

export function InterviewProgressBar({ remaining, total = INTERVIEW_SECONDS }: { remaining: number; total?: number }) {
  const elapsed = Math.max(0, total - remaining);
  const pct = Math.min(100, (elapsed / total) * 100);

  return (
    <div className="interview-progress-bar" title={`${Math.round(pct)}% of 45 min`}>
      <div className="interview-progress-fill" style={{ width: `${pct}%` }} />
      <span className="interview-progress-label">{cdLabel(remaining)}</span>
    </div>
  );
}

function cdLabel(remaining: number) {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${String(s).padStart(2, '0')} left`;
}
