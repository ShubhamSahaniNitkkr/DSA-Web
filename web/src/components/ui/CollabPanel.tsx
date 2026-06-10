import { useMemo, useState } from 'react';
import { Select, Button } from 'antd';
import { VideoCameraOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TopicCard } from '../../lib/api';

interface ProblemOpt {
  value: string;
  label: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  search: string;
}

interface Props {
  sheet: TopicCard[];
  defaultSlug?: string;
  compact?: boolean;
}

export default function CollabPanel({ sheet, defaultSlug, compact }: Props) {
  const navigate = useNavigate();

  const options: ProblemOpt[] = useMemo(() => sheet.flatMap((t) => {
    const topic = t.title.replace(/\[.*?\]/g, '').trim();
    return t.problems.map((p) => {
      const label = p.title;
      const subtopic = p.subtopic || '';
      const search = [p.title, topic, subtopic, p.difficulty, p.slug.replace(/-/g, ' ')]
        .join(' ')
        .toLowerCase();
      return { value: p.slug, label, topic, subtopic, difficulty: p.difficulty, search };
    });
  }), [sheet]);

  const [slug, setSlug] = useState(defaultSlug || options[0]?.value || '');

  const selected = options.find((o) => o.value === slug);

  return (
    <div className={`collab-panel ${compact ? 'compact' : ''}`}>
      <label className="collab-label">Problem</label>
      <Select
        showSearch
        className="collab-select"
        placeholder="Search by full problem name, topic, difficulty..."
        value={slug || undefined}
        popupMatchSelectWidth={false}
        listHeight={280}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
        onChange={setSlug}
        filterOption={(input, opt) => {
          const item = options.find((x) => x.value === opt?.value);
          if (!item) return false;
          const q = input.toLowerCase().trim();
          return item.search.includes(q);
        }}
        optionRender={(opt) => {
          const item = options.find((x) => x.value === opt.value);
          if (!item) return opt.label;
          return (
            <div className="collab-option">
              <span className="collab-option-title">{item.label}</span>
              <span className="collab-option-meta">
                {item.topic}{item.subtopic ? ` · ${item.subtopic}` : ''} · {item.difficulty}
              </span>
            </div>
          );
        }}
      />
      {selected && (
        <p className="collab-selected-hint" title={selected.label}>
          {selected.label}
          <small>{selected.topic} · {selected.difficulty}</small>
        </p>
      )}
      <div className="collab-actions">
        <Button
          className="collab-meet-btn"
          icon={<VideoCameraOutlined />}
          onClick={() => window.open('https://meet.google.com/new')}
        >
          Meet
        </Button>
        <Button
          type="primary"
          className="collab-open-btn"
          icon={<RocketOutlined />}
          disabled={!slug}
          onClick={() => slug && navigate(`/problem/${slug}`)}
        >
          Open
        </Button>
      </div>
    </div>
  );
}
