import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  coins: number;
  size?: 'sm' | 'lg';
  clickable?: boolean;
}

export function formatMoney(coins: number) {
  const paise = coins * 10;
  if (paise >= 100) return `₹${(paise / 100).toFixed(2)}`;
  return `${paise} paise`;
}

export default function CoinCounter({ coins, size = 'sm', clickable = true }: Props) {
  const navigate = useNavigate();
  const spring = useSpring(coins, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => { spring.set(coins); }, [coins, spring]);

  const inner = (
    <>
      <span className="coin-icon">🪙</span>
      <motion.span>{display}</motion.span>
      <span style={{ opacity: 0.65, fontSize: '0.8em', fontWeight: 500 }}>{formatMoney(coins)}</span>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className="coin-pill coin-pill-btn"
        style={{ fontSize: size === 'lg' ? '1rem' : '0.85rem', padding: size === 'lg' ? '8px 16px' : undefined }}
        onClick={() => navigate('/wallet')}
        title="Open wallet"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="coin-pill" style={{ fontSize: size === 'lg' ? '1rem' : '0.85rem', padding: size === 'lg' ? '8px 16px' : undefined }}>
      {inner}
    </div>
  );
}

export function spawnCoinBurst(x: number, y: number, amount: number) {
  const el = document.createElement('div');
  el.className = 'coin-burst';
  el.textContent = `+${amount} coins`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
