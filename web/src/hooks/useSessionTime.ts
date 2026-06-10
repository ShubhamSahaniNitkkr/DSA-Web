import { useEffect, useState } from 'react';
import { formatHMS } from './useStopwatch';

const KEY = 'ss_session_start';

export function markSessionStart() {
  if (typeof window !== 'undefined' && !sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, String(Date.now()));
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}

export function useSessionTime() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Number(sessionStorage.getItem(KEY) || Date.now());
    if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, String(start));
    const tick = () => setSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return formatHMS(seconds);
}
