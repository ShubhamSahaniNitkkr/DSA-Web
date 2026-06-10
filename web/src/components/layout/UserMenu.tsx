import { useState, useRef, useEffect } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useSessionTime, clearSession } from '../../hooks/useSessionTime';
import { MEMOJI } from './DonezoShell';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sessionTime = useSessionTime();
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const avatarEmoji = MEMOJI[initial.charCodeAt(0) % MEMOJI.length];
  const avatarImg = user?.avatarData;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = () => {
    clearSession();
    logout();
    navigate('/login');
  };

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button type="button" className="dz-user dz-user-btn" onClick={() => setOpen(!open)}>
        <div className="dz-user-info">
          <div className="dz-user-name">{user?.name}</div>
          <div className="dz-user-email">{user?.email}</div>
        </div>
        <div className="dz-avatar">{avatarImg ? <img src={avatarImg} alt="" /> : avatarEmoji}</div>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-profile">
            <div className="dz-avatar lg">{avatarImg ? <img src={avatarImg} alt="" /> : avatarEmoji}</div>
            <div>
              <div className="user-menu-name">{user?.name}</div>
              <div className="user-menu-email">{user?.email}</div>
            </div>
          </div>
          <div className="user-menu-session">
            <span>Session time</span>
            <strong>{sessionTime}</strong>
          </div>
          <button type="button" className="user-menu-logout" onClick={handleLogout}>
            <LogoutOutlined /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
