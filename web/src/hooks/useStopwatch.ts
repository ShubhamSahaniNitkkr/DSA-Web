import { useEffect, useRef, useState, useCallback } from 'react';

export function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useStopwatch(onMinuteTick?: () => void) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const lastMinute = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || !onMinuteTick) return;
    const mins = Math.floor(seconds / 60);
    if (mins > lastMinute.current) {
      lastMinute.current = mins;
      onMinuteTick();
    }
  }, [seconds, running, onMinuteTick]);

  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
    lastMinute.current = 0;
  }, []);

  return { running, seconds, toggle, reset, formatted: formatHMS(seconds) };
}

/** Countdown for interview-style problem timer (default 45 min) */
export function useCountdown(initialSeconds: number, autoStart = false) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  return {
    remaining,
    running,
    expired: remaining === 0,
    formatted: formatHMS(remaining),
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => { setRemaining(initialSeconds); setRunning(false); },
  };
}
