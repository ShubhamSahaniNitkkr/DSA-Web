import { useEffect, useRef, useState, useCallback } from 'react';
import { useCountdown } from './useStopwatch';
import { api } from '../lib/api';

export const INTERVIEW_SECONDS = 45 * 60;
const AUTO_START_DELAY = 30;
const SYNC_INTERVAL_SEC = 15;

export function useProblemSession(slug: string | undefined, onFlushed?: () => void) {
  const interviewTimer = useCountdown(INTERVIEW_SECONDS);
  const timerRef = useRef(interviewTimer);
  timerRef.current = interviewTimer;
  const solveSyncRef = useRef(0);
  const solveElapsedRef = useRef(0);

  const [autoStartLeft, setAutoStartLeft] = useState(AUTO_START_DELAY);
  const [autoStartCancelled, setAutoStartCancelled] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const [showStartedMsg, setShowStartedMsg] = useState(false);

  const flushSession = useCallback((force = false) => {
    if (!slug) return;
    const delta = solveElapsedRef.current - solveSyncRef.current;
    if (delta <= 0 && !force) return;
    if (delta > 0) {
      solveSyncRef.current = solveElapsedRef.current;
      api.syncTimeKeepalive({
        solveSeconds: delta,
        lastSessionSeconds: solveElapsedRef.current,
        problemSlug: slug,
      });
      onFlushed?.();
    }
  }, [slug, onFlushed]);

  const cancelAutoStart = useCallback(() => {
    setAutoStartCancelled(true);
    setAutoStartLeft(0);
  }, []);

  const startNow = useCallback(() => {
    setAutoStartCancelled(true);
    setAutoStartLeft(0);
    if (!timerRef.current.running) {
      timerRef.current.start();
      setAutoStarted(true);
    }
  }, []);

  // 30s idle → auto-start timer with message
  useEffect(() => {
    if (!slug || autoStartCancelled || timerRef.current.running || autoStarted) return;
    if (autoStartLeft <= 0) {
      setAutoStarted(true);
      setShowStartedMsg(true);
      timerRef.current.start();
      return;
    }
    const id = setTimeout(() => setAutoStartLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [slug, autoStartLeft, autoStartCancelled, autoStarted, interviewTimer.running]);

  // Tick session seconds every second while timer runs
  useEffect(() => {
    if (!interviewTimer.running) return;
    const id = setInterval(() => { solveElapsedRef.current += 1; }, 1000);
    return () => clearInterval(id);
  }, [interviewTimer.running]);

  // Sync unsynced solve time every 15s while timer runs
  useEffect(() => {
    if (!interviewTimer.running || !slug) return;
    const sync = () => {
      const delta = solveElapsedRef.current - solveSyncRef.current;
      if (delta > 0) {
        api.syncTime({ solveSeconds: delta, problemSlug: slug }).catch(() => {});
        solveSyncRef.current = solveElapsedRef.current;
      }
    };
    const id = setInterval(sync, SYNC_INTERVAL_SEC * 1000);
    return () => clearInterval(id);
  }, [interviewTimer.running, slug]);

  // Flush on tab close, hide, or leave page
  useEffect(() => {
    if (!slug) return;

    const onHide = () => {
      if (document.visibilityState === 'hidden') flushSession();
    };
    const onUnload = () => flushSession();

    window.addEventListener('pagehide', onUnload);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onUnload);
      document.removeEventListener('visibilitychange', onHide);
      flushSession();
    };
  }, [slug, flushSession]);

  const onTimerStop = useCallback(() => {
    flushSession();
  }, [flushSession]);

  const onTimerPlay = useCallback(() => {
    setAutoStartCancelled(true);
    setShowStartedMsg(false);
  }, []);

  const onTimerReset = useCallback(() => {
    timerRef.current.reset();
    solveSyncRef.current = 0;
    solveElapsedRef.current = 0;
    setAutoStarted(false);
    setShowStartedMsg(false);
    setAutoStartCancelled(false);
    setAutoStartLeft(AUTO_START_DELAY);
  }, []);

  return {
    interviewTimer,
    autoStartLeft,
    autoStartCancelled,
    autoStarted,
    showStartedMsg,
    dismissStartedMsg: () => setShowStartedMsg(false),
    cancelAutoStart,
    startNow,
    onTimerStop,
    onTimerPlay,
    onTimerReset,
    sessionSeconds: solveElapsedRef,
  };
}
