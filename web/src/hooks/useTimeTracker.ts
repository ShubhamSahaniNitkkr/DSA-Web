import { useCallback, useEffect, useRef, useState } from 'react';
import { formatHMS } from './useStopwatch';
import { api } from '../lib/api';

type Mode = 'active' | 'solve';

export function useTimeTracker(mode: Mode, problemSlug?: string) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const sessionStart = useRef<number | null>(null);
  const lastSync = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || seconds - lastSync.current < 15) return;
    const delta = seconds - lastSync.current;
    lastSync.current = seconds;
    const payload = mode === 'active'
      ? { activeSeconds: delta }
      : { solveSeconds: delta, problemSlug };
    api.syncTime(payload).catch(() => {});
  }, [seconds, running, mode, problemSlug]);

  const play = useCallback(() => {
    if (!sessionStart.current) sessionStart.current = Date.now();
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    const delta = seconds - lastSync.current;
    if (delta > 0) {
      const payload = mode === 'active'
        ? { activeSeconds: delta, lastSessionSeconds: seconds }
        : { solveSeconds: delta, lastSessionSeconds: seconds, problemSlug };
      api.syncTime(payload).catch(() => {});
      lastSync.current = seconds;
    }
  }, [seconds, mode, problemSlug]);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
    sessionStart.current = null;
    lastSync.current = 0;
  }, []);

  return { running, seconds, formatted: formatHMS(seconds), play, stop, reset };
}
