import { useMemo, useState } from 'react';
import { Select, Button, Input, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TopicCard } from '../../lib/api';
import { api } from '../../lib/api';

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
  userEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CollabPanel({ sheet, defaultSlug, compact, userEmail }: Props) {
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

  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState(defaultSlug || options[0]?.value || '');
  const [starting, setStarting] = useState(false);

  const trimmedEmail = email.trim().toLowerCase();
  const emailFormatValid = EMAIL_RE.test(trimmedEmail);
  const isSelf = Boolean(userEmail && trimmedEmail === userEmail.toLowerCase());
  const emailReady = emailFormatValid && !isSelf;
  const selected = options.find((o) => o.value === slug);

  const handleStart = async () => {
    if (!emailReady || !slug) return;
    setStarting(true);
    try {
      const result = await api.startCollab({
        inviteeEmail: trimmedEmail,
        problemSlug: slug,
      });
      message.success(`Challenge sent to ${trimmedEmail}`);
      window.open(result.meetLink, '_blank', 'noopener,noreferrer');
      navigate(`/problem/${result.problemSlug}?collab=1`);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Could not start collab');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className={`collab-panel${compact ? ' compact' : ''}${emailReady ? ' is-expanded' : ''}`}>
      <label className="collab-label">Friend&apos;s email</label>
      <Input
        type="email"
        className="collab-email-input dash-form-input"
        placeholder="anyone@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        status={email && emailFormatValid && isSelf ? 'error' : undefined}
      />
      {email && emailFormatValid && isSelf && (
        <p className="collab-email-hint error">You cannot invite yourself</p>
      )}
      {emailReady && (
        <p className="collab-email-hint ok">
          {compact ? 'Invite via email link' : 'They\u2019ll get an email — sign up from the link to join'}
        </p>
      )}

      {emailReady && (
        <>
          <label className="collab-label">Problem</label>
          <Select
            showSearch
            className="collab-select dash-form-select"
            placeholder={compact ? 'Pick a problem' : 'Search by full problem name, topic, difficulty...'}
            value={slug || undefined}
            popupMatchSelectWidth
            listHeight={compact ? 220 : 280}
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
          {selected && !compact && (
            <p className="collab-selected-hint" title={selected.label}>
              {selected.label}
              <small>{selected.topic} · {selected.difficulty}</small>
            </p>
          )}
          <div className="collab-actions collab-actions-single">
            <Button
              type="primary"
              block
              className="dash-btn dash-btn-primary collab-start-btn"
              icon={<RocketOutlined />}
              disabled={!slug}
              loading={starting}
              onClick={handleStart}
            >
              Start challenge
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
