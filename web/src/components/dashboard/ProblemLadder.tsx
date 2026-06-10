import { CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TopicCard } from '../../lib/api';

type Problem = TopicCard['problems'][number];

interface Props {
  problems: Problem[];
  progress: Record<string, boolean>;
  onToggle: (problemId: string, checked: boolean, pos: { clientX: number; clientY: number }) => void;
}

function diffCls(d: string) {
  if (d === 'Easy') return 'done';
  if (d === 'Medium') return 'progress';
  return 'pending';
}

export default function ProblemLadder({ problems, progress, onToggle }: Props) {
  const navigate = useNavigate();

  return (
    <div className="problem-ladder-grid">
      {problems.map((p, idx) => {
        const done = !!progress[p._id];
        const firstOpen = !done && problems.slice(0, idx).every((x) => progress[x._id]);
        const locked = !done && !firstOpen && idx > 0;
        const barPct = done ? 100 : firstOpen ? 42 : 0;

        return (
          <div
            key={p._id}
            className={`ladder-card ${done ? 'is-done' : ''} ${firstOpen ? 'is-next' : ''} ${locked ? 'is-locked' : ''}`}
            onClick={() => navigate(`/problem/${p.slug}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/problem/${p.slug}`)}
          >
            <div className="ladder-card-bar">
              <div className="ladder-card-bar-fill" style={{ width: `${barPct}%` }} />
            </div>

            {done && <span className="ladder-done-ribbon">Done</span>}

            <div className="ladder-card-num">
              {done ? <CheckOutlined /> : idx + 1}
            </div>

            <div className="ladder-card-body">
              <span className={`ladder-diff dz-badge ${diffCls(p.difficulty)}`}>{p.difficulty}</span>
              <strong className="ladder-card-title">{p.title}</strong>
              {p.subtopic && <small className="ladder-card-sub">{p.subtopic}</small>}
            </div>

            <button
              type="button"
              className={`ladder-card-check ${done ? 'on' : ''}`}
              aria-label={done ? 'Mark unsolved' : 'Mark solved'}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                onToggle(p._id, !done, { clientX: rect.x, clientY: rect.y });
              }}
            >
              {done ? <CheckOutlined /> : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}
