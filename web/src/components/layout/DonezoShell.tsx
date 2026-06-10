import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';
import { useAuth } from '../app/AuthContext';
import CoinCounter from '../ui/CoinCounter';
import UserMenu from './UserMenu';
import CommandPalette from '../ui/CommandPalette';
import type { TopicCard } from '../../lib/api';

const APP_NAME = 'Shubham Sunny DSA Sheet';

const MEMOJI = ['👨‍💼', '👩‍💻', '🧑‍🎨', '👨‍🔬', '👩‍🏫', '🧑‍💻', '👨‍🎓', '👩‍🔬'];
export { MEMOJI };

function LogoIcon({ size = 34 }: { size?: number }) {
  return (
    <svg className="dz-logo-icon" width={size} height={size} viewBox="0 0 38 38" fill="none">
      <circle cx="19" cy="19" r="19" fill="#0D4429" />
      <path d="M12 19C12 14.58 15.58 11 20 11C24.42 11 28 14.58 28 19C28 23.42 24.42 27 20 27" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="19" r="3" fill="#D8F3DC" />
    </svg>
  );
}

interface Props {
  children: React.ReactNode;
  coins?: number;
  sheet?: TopicCard[];
}

export default function DonezoShell({ children, coins, sheet = [] }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);
  const displayCoins = coins ?? user?.coins ?? 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="dz-app dz-no-sidebar">
      <div className="dz-main-wrap dz-full-width">
        <header className="dz-topbar dz-topbar-nav">
          <a
            href="/"
            className="dz-logo dz-logo-top"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            <LogoIcon />
            <span className="logo-text">{APP_NAME}</span>
          </a>

          <button type="button" className="dz-search dz-search-btn" onClick={() => setCmdOpen(true)}>
            <SearchOutlined />
            <span>Search problems...</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="dz-topbar-actions">
            <CoinCounter coins={displayCoins} />
            <UserMenu />
          </div>
        </header>
        <div className="dz-content dz-scroll-page">{children}</div>
      </div>

      <CommandPalette sheet={sheet} open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
