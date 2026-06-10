import { useEffect, useState, useCallback } from 'react';
import PageLoader from '../ui/PageLoader';
import { api, type TopicCard, type Badge } from '../../lib/api';
import { useAuth } from './AuthContext';
import DonezoShell from '../layout/DonezoShell';
import { spawnCoinBurst } from '../ui/CoinCounter';
import CongratsModal from '../ui/CongratsModal';
import BentoDashboard from '../dashboard/BentoDashboard';
import TopicSheetPanel from '../dashboard/TopicSheetPanel';

interface FullDash {
  user: {
    name: string;
    email?: string;
    coins: number;
    badges: Badge[];
    emailReminders?: boolean;
    reminderTimes?: string[];
    reminderDays?: number[];
    avatarData?: string;
  };
  stats: { totalProblems: number; completedCount: number };
  consistency: { label: string; focusMinutes: number; active: boolean }[];
  calendar: { date: string; level: number }[];
  badgeCatalog: Badge[];
  sheet: TopicCard[];
  progress: Record<string, boolean>;
}

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<FullDash | null>(null);
  const [loading, setLoading] = useState(true);
  const [congrats, setCongrats] = useState({ open: false, coins: 5 });
  const load = useCallback(() => {
    setLoading(true);
    api.getDashboardFull({})
      .then((d) => setData(d as FullDash))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleProblem = async (problemId: string, checked: boolean, pos: { clientX: number; clientY: number }) => {
    if (!data) return;
    const wasDone = data.progress[problemId];
    setData({ ...data, progress: { ...data.progress, [problemId]: checked } });
    try {
      const res = await api.toggleProgress(problemId, checked);
      if (checked && !wasDone && res.coinsEarned > 0) {
        spawnCoinBurst(pos.clientX, pos.clientY, res.coinsEarned);
        setCongrats({ open: true, coins: res.coinsEarned });
        refreshUser();
        load();
      }
    } catch { load(); }
  };

  if (loading && !data) {
    return <DonezoShell><PageLoader label="Loading dashboard..." /></DonezoShell>;
  }

  return (
    <DonezoShell coins={user?.coins} sheet={data?.sheet || []}>
      <section id="dash-bento" className="scroll-section">
        <BentoDashboard
          userName={user?.name ?? data?.user.name ?? 'Coder'}
          userEmail={user?.email ?? data?.user.email}
          coins={user?.coins ?? 0}
          completed={data?.stats.completedCount ?? 0}
          total={data?.stats.totalProblems ?? 0}
          consistency={data?.consistency || []}
          calendar={data?.calendar || []}
          earnedBadges={data?.user.badges || []}
          badgeCatalog={data?.badgeCatalog || []}
          avatarData={user?.avatarData ?? data?.user.avatarData}
          sheet={data?.sheet || []}
          emailReminders={user?.emailReminders ?? data?.user.emailReminders}
          reminderTimes={user?.reminderTimes ?? data?.user.reminderTimes}
          reminderDays={user?.reminderDays ?? data?.user.reminderDays}
          onPrefsSaved={refreshUser}
          onAvatarSaved={refreshUser}
        />
      </section>

      <section id="topics-sheet" className="scroll-section">
        <TopicSheetPanel
          sheet={data?.sheet || []}
          progress={data?.progress || {}}
          onToggle={toggleProblem}
        />
      </section>

      <CongratsModal open={congrats.open} coins={congrats.coins} onClose={() => setCongrats({ open: false, coins: 5 })} />
    </DonezoShell>
  );
}
