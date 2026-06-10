import { useEffect, useState } from 'react';
import { Select, AutoComplete } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { api, type TopicCard } from '../../lib/api';
import { getChapterLabel } from '../../lib/chapterLabels';
import { getChapterEmoji } from '../../lib/chapterEmojis';
import { tintForChapter } from '../../lib/bentoTints';
import ProblemLadder from './ProblemLadder';

interface Props {
  sheet: TopicCard[];
  progress: Record<string, boolean>;
  onToggle: (problemId: string, checked: boolean, pos: { clientX: number; clientY: number }) => void;
}

export default function TopicSheetPanel({ sheet, progress, onToggle }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [company, setCompany] = useState<string>('');
  const [companyOptions, setCompanyOptions] = useState<{ value: string }[]>([]);

  useEffect(() => {
    api.getCompanies().then((r) => {
      setCompanyOptions((r.companies || []).map((c) => ({ value: c })));
    }).catch(() => {});
  }, []);

  const hasFilters = Boolean(difficulty || company.trim());

  const filtered = sheet
    .map((t) => ({ ...t, tint: tintForChapter(t.title), label: getChapterLabel(t.title) }))
    .map((t) => ({
      ...t,
      problems: t.problems.filter((p) => {
        if (difficulty && p.difficulty !== difficulty) return false;
        if (company.trim()) {
          const c = company.toLowerCase();
          const tags = p.companies || [];
          if (!tags.some((co) => co.toLowerCase().includes(c))) return false;
        }
        return true;
      }),
    }))
    .filter((t) => t.problems.length > 0);

  const totalProblems = sheet.reduce((n, t) => n + t.totalQuestions, 0);

  return (
    <div className="topic-bento-wrap">
      <div className="topic-bento-head">
        <div className="topic-bento-head-left">
          <h2>DSA Sheet — All Topics</h2>
          <p>{sheet.length} chapters · {totalProblems} problems · scroll on one page</p>
        </div>
        <div className="topic-bento-filters">
          <Select
            placeholder="Difficulty"
            allowClear
            style={{ width: 120 }}
            value={difficulty}
            onChange={setDifficulty}
            options={[{ value: 'Easy' }, { value: 'Medium' }, { value: 'Hard' }]}
          />
          <AutoComplete
            style={{ width: 180 }}
            placeholder="Company"
            allowClear
            value={company}
            options={companyOptions}
            onChange={setCompany}
            onSearch={(text) => setCompany(text)}
            filterOption={(input, opt) => String(opt?.value).toLowerCase().includes(input.toLowerCase())}
          />
        </div>
      </div>

      {hasFilters && filtered.length === 0 && (
        <p className="topic-filter-empty">No chapters match your filters. Try easing difficulty or company.</p>
      )}

      <div className="topic-bento-list">
        {filtered.map((topic) => {
          const isOpen = openId === topic._id;
          const solved = topic.problems.filter((p) => progress[p._id]).length;
          const total = topic.problems.length;
          const pct = total ? Math.round((solved / total) * 100) : 0;
          const done = total > 0 && solved >= total;
          const cleanTitle = topic.title.replace(/\[.*?\]/g, '').trim();

          return (
            <div
              key={topic._id}
              className={`glass-card topic-chapter-card topic-glass-card ${isOpen ? 'is-open' : ''} ${done ? 'is-complete' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${topic.tint.glass}, transparent 65%), rgba(255,255,255,0.45)`,
                borderColor: done ? 'rgba(82, 183, 136, 0.45)' : topic.tint.border,
                ['--topic-accent' as string]: topic.tint.accent,
              }}
            >
              <button
                type="button"
                className="topic-chapter-head"
                onClick={() => setOpenId(isOpen ? null : topic._id)}
              >
                <div className="topic-chapter-head-row">
                  <span className="topic-chevron">{isOpen ? <DownOutlined /> : <RightOutlined />}</span>
                  <span className="topic-emoji">{getChapterEmoji(topic.title)}</span>
                  <span className="topic-label" style={{ background: 'rgba(255,255,255,0.75)', color: topic.tint.accent }}>
                    {topic.label.label}
                  </span>
                  <span className="topic-title">{cleanTitle}</span>
                  <span className="topic-meta">{solved}/{total}</span>
                  {done && <span className="dz-badge done">Done</span>}
                </div>

                <div className="topic-chapter-summary">
                  <div className="topic-chapter-progress-track">
                    <div className="topic-chapter-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="topic-chapter-summary-text">
                    <span>{solved} of {total} problems solved</span>
                    <strong>{pct}%</strong>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="topic-chapter-body">
                  <ProblemLadder
                    problems={topic.problems}
                    progress={progress}
                    onToggle={onToggle}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
