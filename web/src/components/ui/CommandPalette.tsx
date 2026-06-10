import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, EnterOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { TopicCard } from '../../lib/api';

interface ProblemHit {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  search: string;
}

interface Props {
  sheet: TopicCard[];
  open: boolean;
  onClose: () => void;
}

function diffClass(d: string) {
  if (d === 'Easy') return 'done';
  if (d === 'Medium') return 'progress';
  return 'pending';
}

export default function CommandPalette({ sheet, open, onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const allProblems = useMemo<ProblemHit[]>(() =>
    sheet.flatMap((t) => {
      const topic = t.title.replace(/\[.*?\]/g, '').trim();
      return t.problems.map((p) => ({
        slug: p.slug,
        title: p.title,
        topic,
        difficulty: p.difficulty,
        search: [p.title, topic, p.subtopic, p.difficulty, p.slug.replace(/-/g, ' ')].join(' ').toLowerCase(),
      }));
    }), [sheet]);

  const suggestions = useMemo(() => {
    const lower = q.toLowerCase().trim();
    const pool = lower
      ? allProblems.filter((p) => p.search.includes(lower))
      : allProblems;
    return pool.slice(0, 5);
  }, [q, allProblems]);

  const openProblem = useCallback((slug: string) => {
    navigate(`/problem/${slug}`);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setActive(0);
      return;
    }
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, suggestions.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && suggestions[active]) {
        e.preventDefault();
        openProblem(suggestions[active].slug);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, suggestions, active, onClose, openProblem]);

  if (!open) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose} role="presentation">
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search problems">
        <div className="cmd-palette-search">
          <SearchOutlined className="cmd-search-icon" />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            placeholder="Search problems, topics, difficulty..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd className="cmd-esc" onClick={onClose}>esc</kbd>
        </div>

        <div className="cmd-palette-body">
          {suggestions.length > 0 ? (
            <ul className="cmd-palette-list">
              {suggestions.map((p, i) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={`cmd-palette-item ${i === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => openProblem(p.slug)}
                  >
                    <div className="cmd-item-main">
                      <span className="cmd-item-title">{p.title}</span>
                      <span className="cmd-item-topic">{p.topic}</span>
                    </div>
                    <span className={`dz-badge cmd-diff-badge ${diffClass(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cmd-empty">
              <span className="cmd-empty-icon">🔍</span>
              <p>No problems found for &ldquo;{q}&rdquo;</p>
              <small>Try a different keyword or chapter name</small>
            </div>
          )}
        </div>

        <div className="cmd-palette-footer">
          <span className="cmd-footer-hint">
            <kbd><ArrowUpOutlined /><ArrowDownOutlined /></kbd> navigate
          </span>
          <span className="cmd-footer-hint">
            <kbd><EnterOutlined /></kbd> open
          </span>
          <span className="cmd-footer-hint cmd-footer-count">
            {suggestions.length} of {allProblems.length}
          </span>
        </div>
      </div>
    </div>
  );
}
