import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  coins: number;
  title?: string;
  onClose: () => void;
}

export default function CongratsModal({ open, coins, title = 'Nice work.', onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.65 },
      colors: ['#1b4332', '#52b788', '#74c69d', '#d8f3dc'],
    });
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="congrats-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="congrats-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="congrats-emoji">🎉</div>
            <h2 style={{ marginBottom: 8 }}>{title}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 16 }}>
              That one's in the bag. Keep going.
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>
              +{coins} coins ({coins * 10} paise)
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
