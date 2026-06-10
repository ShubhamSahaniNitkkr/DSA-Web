import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Input, Tag, message, Tabs, Collapse } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import PageLoader from '../ui/PageLoader';
import {
  ArrowLeftOutlined, LinkOutlined, ReadOutlined, CodeOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { api, type ProblemDetail, type SheetData, type TopicCard } from '../../lib/api';
import { useAuth } from './AuthContext';
import DonezoShell from '../layout/DonezoShell';
import CongratsModal from '../ui/CongratsModal';
import { spawnCoinBurst } from '../ui/CoinCounter';
import ProblemTimer, { InterviewProgressBar } from '../ui/ProblemTimer';
import { useProblemSession } from '../../hooks/useProblemSession';
import { getChapterLabel } from '../../lib/chapterLabels';
import { NAV_EMOJI } from '../../lib/chapterEmojis';
import RichText from '../ui/RichText';
import CollabPanel from '../ui/CollabPanel';
import ProblemTimeChart from '../ui/ProblemTimeChart';
import ProblemInsights from '../ui/ProblemInsights';
import type { ProblemInsightsData } from '../../lib/api';

const { TextArea } = Input;

function ytId(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return m?.[1] || null;
}

function hasText(v?: string | null) {
  const t = String(v || '').trim();
  return t.length > 0 && t !== '—' && t !== '-';
}

function normUrl(u: string) {
  return u.replace(/\/$/, '').toLowerCase();
}

function getStatement(sd: SheetData): string {
  if (hasText(sd.problemStatement)) return sd.problemStatement!.trim();
  if (hasText(sd.fullArticleText)) {
    const full = sd.fullArticleText!.trim();
    const ps = full.match(/Problem Statement:\s*([\s\S]*?)(?=Examples|Brute|Optimal|$)/i);
    if (ps?.[1]?.trim()) return ps[1].trim();
    return full.slice(0, 2500);
  }
  return '';
}

function hasBrute(sd: SheetData) {
  return hasText(sd.bruteForce?.algorithm)
    || hasText(sd.bruteForce?.timeComplexity)
    || hasText(sd.bruteForce?.spaceComplexity);
}

function hasOptimal(sd: SheetData) {
  return hasText(sd.optimal?.algorithm)
    || hasText(sd.optimal?.timeComplexity)
    || hasText(sd.optimal?.spaceComplexity);
}

function hasSolutionCode(codes: Record<string, string>) {
  return Object.values(codes).some((c) => hasText(c) && c.length > 30);
}

function buildResourceLinks(
  sd: SheetData,
  problem: ProblemDetail['problem'],
  hasEmbeddedVideo: boolean,
) {
  const article = (sd.articleLink || problem.resources.article || '').trim();
  const editorial = (sd.editorialLink || '').trim();
  const sameArticle = article && editorial && normUrl(article) === normUrl(editorial);

  type LinkItem = { href: string; icon: React.ReactNode; title: string; sub: string; variant: string };
  const items: LinkItem[] = [];

  if (sameArticle) {
    items.push({
      href: editorial,
      icon: <ReadOutlined />,
      title: 'Article & Editorial',
      sub: sd.articleTitle || 'Read full solution',
      variant: 'art',
    });
  } else {
    if (hasText(editorial)) {
      items.push({ href: editorial, icon: <ReadOutlined />, title: 'Editorial', sub: 'Detailed walkthrough', variant: 'ed' });
    }
    if (hasText(article)) {
      items.push({ href: article, icon: <ReadOutlined />, title: 'Article', sub: sd.articleTitle || 'Read solution', variant: 'art' });
    }
  }

  const practice = (sd.practiceLink || problem.resources.leetcode || '').trim();
  if (hasText(practice)) {
    items.push({ href: practice, icon: <CodeOutlined />, title: 'Practice', sub: 'Solve on platform', variant: 'lc' });
  }
  if (hasText(sd.problemLink)) {
    items.push({ href: sd.problemLink!, icon: <LinkOutlined />, title: 'Problem Page', sub: 'Original link', variant: 'link' });
  }
  if (hasText(sd.solveLink)) {
    items.push({ href: sd.solveLink!, icon: <LinkOutlined />, title: 'Solve Online', sub: 'Interactive solve', variant: 'solve' });
  }

  if (!hasEmbeddedVideo) {
    const yt = (sd.youtubeLink || problem.resources.youtube || '').trim();
    if (hasText(yt)) {
      items.push({ href: yt, icon: <ReadOutlined />, title: 'YouTube', sub: 'Watch video', variant: 'yt' });
    }
  }

  return items;
}

function CodeBlock({ code }: { code?: string }) {
  if (!hasText(code)) return null;
  return <pre className="bento-code">{code}</pre>;
}

function ResourceLink({ href, icon, title, sub, variant }: { href: string; icon: React.ReactNode; title: string; sub: string; variant: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`resource-tile compact ${variant}`}>
      <span className="resource-tile-icon">{icon}</span>
      <span className="resource-tile-text">
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
    </a>
  );
}

export default function ProblemPage() {
  const { slug } = useParams();
  const { refreshUser } = useAuth();
  const [data, setData] = useState<ProblemDetail | null>(null);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [congrats, setCongrats] = useState(false);
  const [codeLang, setCodeLang] = useState('javascript');
  const [runResult, setRunResult] = useState<{ allPassed?: boolean } | null>(null);
  const [sheet, setSheet] = useState<TopicCard[]>([]);
  const [timeHistory, setTimeHistory] = useState<{ date: string; minutes: number }[]>([]);
  const [timeDemo, setTimeDemo] = useState(false);
  const [insights, setInsights] = useState<ProblemInsightsData | null>(null);

  const refreshInsights = () => {
    if (!slug) return;
    api.getProblemInsights(slug).then((r) => setInsights(r.insights)).catch(() => {});
    api.getProblemTimeHistory(slug).then((r) => {
      setTimeHistory(r.history);
      setTimeDemo(!!r.demo);
    }).catch(() => {});
  };

  const session = useProblemSession(slug, refreshInsights);

  useEffect(() => {
    if (!slug) return;
    api.getProblem(slug).then((d) => {
      setData(d);
      setCode(d.problem.starterCode);
      setNote(d.note);
    });
    refreshInsights();
    api.getSheet().then((r) => setSheet(r.sheet)).catch(() => {});
  }, [slug]);

  const toggleComplete = async (e: React.MouseEvent) => {
    if (!data) return;
    session.onTimerStop();
    const checked = !data.completed;
    try {
      const res = await api.toggleProgress(data.problem._id, checked);
      setData({ ...data, completed: checked });
      if (checked && res.coinsEarned > 0) {
        spawnCoinBurst(e.clientX, e.clientY, res.coinsEarned);
        setCongrats(true);
        refreshUser();
      }
      refreshInsights();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (!data) return <PageLoader label="Loading problem..." fullPage />;

  const { problem, topic } = data;
  const sd = (problem.sheetData || {}) as SheetData;
  const label = getChapterLabel(topic.title);
  const yt = sd.youtubeLink || problem.resources.youtube;
  const videoId = ytId(yt);
  const statement = getStatement(sd);
  const links = buildResourceLinks(sd, problem, !!videoId);

  const codes: Record<string, string> = {
    javascript: sd.optimal?.codeJs || sd.bruteForce?.codeJs || problem.starterCode,
    python: sd.optimal?.codePython || sd.bruteForce?.codePython || '',
    java: sd.optimal?.codeJava || sd.bruteForce?.codeJava || '',
    cpp: sd.optimal?.codeCpp || sd.bruteForce?.codeCpp || '',
  };

  const codeTabs = [
    { key: 'javascript', label: 'JS', code: codes.javascript },
    { key: 'python', label: 'Python', code: codes.python },
    { key: 'java', label: 'Java', code: codes.java },
    { key: 'cpp', label: 'C++', code: codes.cpp },
  ].filter((t) => hasText(t.code) && t.code.length > 30);

  const showBrute = hasBrute(sd);
  const showOptimal = hasOptimal(sd);
  const showSolution = hasSolutionCode(codes);

  return (
    <DonezoShell sheet={sheet}>
      <div className="problem-page-wrap">
        <Link to="/#topics-sheet" className="dz-back-link"><ArrowLeftOutlined /> Back to sheet</Link>

        <div className="problem-layout">
          {/* Left — notes only */}
          <aside className="notes-rail">
            <div className="glass-card notes-card">
              <h4 className="cell-title">{NAV_EMOJI.notes} Notes</h4>
              <TextArea
                className="notes-textarea"
                rows={14}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Approach, hints, edge cases..."
              />
              <Button block size="small" className="notes-save-btn" onClick={async () => {
                session.onTimerStop();
                await api.saveNote(slug!, note);
                message.success('Notes saved');
                refreshInsights();
              }}>💾 Save</Button>
            </div>
          </aside>

          {/* Center */}
          <main className="problem-main">
            <div className="glass-card bento-hero" style={{ borderLeft: `4px solid ${label.fg}` }}>
              <span className="topic-label" style={{ background: label.bg, color: label.fg }}>{label.label}</span>
              <h1>{sd.articleTitle || problem.title}</h1>
              {sd.articleTitle && problem.title !== sd.articleTitle && <p className="hero-sub">{problem.title}</p>}
              <div className="hero-tags">
                <span className={`dz-badge ${problem.difficulty === 'Easy' ? 'done' : problem.difficulty === 'Medium' ? 'progress' : 'pending'}`}>{problem.difficulty}</span>
                {problem.subtopic && <Tag>{problem.subtopic}</Tag>}
              </div>

              <div className="problem-action-bar">
                <button type="button" className={`action-chip solved ${data.completed ? 'active' : ''}`} onClick={toggleComplete}>
                  <span className="chip-emoji">{data.completed ? '✅' : '⭕'}</span>
                  <span className="chip-label">{data.completed ? 'Solved' : 'Mark solved'}</span>
                  {!data.completed && <span className="chip-sub">+5🪙</span>}
                </button>
                <button type="button" className={`action-chip fav ${data.isFavorite ? 'active' : ''}`} onClick={async () => {
                  const r = await api.toggleFavorite(slug!);
                  setData({ ...data, isFavorite: r.isFavorite });
                }}>
                  <span className="chip-emoji">{data.isFavorite ? '⭐' : '☆'}</span>
                  <span className="chip-label">{data.isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>
                <button type="button" className={`action-chip like ${data.userReaction === 'like' ? 'active' : ''}`} onClick={async () => {
                  const r = await api.setReaction(slug!, 'like');
                  setData({ ...data, problem: { ...problem, likes: r.likes, dislikes: r.dislikes }, userReaction: r.userReaction });
                }}>
                  <span className="chip-emoji">👍</span>
                  <span className="chip-count">{problem.likes}</span>
                </button>
                <button type="button" className={`action-chip dislike ${data.userReaction === 'dislike' ? 'active' : ''}`} onClick={async () => {
                  const r = await api.setReaction(slug!, 'dislike');
                  setData({ ...data, problem: { ...problem, likes: r.likes, dislikes: r.dislikes }, userReaction: r.userReaction });
                }}>
                  <span className="chip-emoji">👎</span>
                  <span className="chip-count">{problem.dislikes}</span>
                </button>
              </div>
            </div>

            {hasText(statement) && (
              <div className="glass-card problem-content-card">
                <h4 className="cell-title">{NAV_EMOJI.statement} Problem Statement</h4>
                <RichText text={statement} />
              </div>
            )}

            {hasText(sd.examples) && (
              <div className="glass-card problem-content-card">
                <h4 className="cell-title">{NAV_EMOJI.examples} Examples</h4>
                <pre className="examples-block">{sd.examples}</pre>
              </div>
            )}

            {(showBrute || showOptimal) && (
              <div className={`problem-approach-row ${showBrute && showOptimal ? '' : 'single'}`}>
                {showBrute && (
                  <div className="glass-card problem-content-card">
                    <h4 className="cell-title">{NAV_EMOJI.brute} Brute Force</h4>
                    {hasText(sd.bruteForce?.algorithm) && <RichText text={sd.bruteForce!.algorithm} />}
                    <div className="complexity-row">
                      {hasText(sd.bruteForce?.timeComplexity) && <span>⏱ {sd.bruteForce!.timeComplexity}</span>}
                      {hasText(sd.bruteForce?.spaceComplexity) && <span>💾 {sd.bruteForce!.spaceComplexity}</span>}
                    </div>
                  </div>
                )}
                {showOptimal && (
                  <div className="glass-card problem-content-card">
                    <h4 className="cell-title">{NAV_EMOJI.optimal} Optimal</h4>
                    {hasText(sd.optimal?.algorithm) && <RichText text={sd.optimal!.algorithm} />}
                    <div className="complexity-row">
                      {hasText(sd.optimal?.timeComplexity) && <span>⏱ {sd.optimal!.timeComplexity}</span>}
                      {hasText(sd.optimal?.spaceComplexity) && <span>💾 {sd.optimal!.spaceComplexity}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasText(sd.otherApproaches) && (
              <div className="glass-card">
                <h4 className="cell-title">🔀 Other Approaches</h4>
                <div className="cell-body">{sd.otherApproaches}</div>
              </div>
            )}

            <div className="glass-card bento-ide">
              <div className="ide-head">
                <h4 className="cell-title">{NAV_EMOJI.ide} Code IDE</h4>
                <Button type="primary" onClick={async () => {
                  const res = await api.runCode(slug!, code);
                  setRunResult(res);
                  message[res.allPassed ? 'success' : 'warning'](res.allPassed ? 'All tests passed!' : 'Check output');
                }}>Run & Test</Button>
              </div>
              <Editor
                height="min(58vh, 560px)"
                language="javascript"
                value={code}
                onChange={(v) => setCode(v || '')}
                theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: true }, padding: { top: 12 }, scrollBeyondLastLine: false }}
              />
              {runResult && <p className="ide-result">{runResult.allPassed ? '✓ All tests passed' : 'Some tests failed'}</p>}
            </div>

            {showSolution && codeTabs.length > 0 && (
              <div className="glass-card solution-collapse-card">
                <Collapse
                  bordered={false}
                  expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
                  className="solution-collapse"
                  items={[{
                    key: 'solution',
                    label: (
                      <span className="solution-collapse-label">
                        <span>{NAV_EMOJI.solution} Solution Code</span>
                        <small>Tap to reveal — spoiler free by default</small>
                      </span>
                    ),
                    children: (
                      <Tabs
                        activeKey={codeLang}
                        onChange={setCodeLang}
                        items={codeTabs.map((t) => ({
                          key: t.key,
                          label: t.label,
                          children: <CodeBlock code={t.code} />,
                        }))}
                      />
                    ),
                  }]}
                />
              </div>
            )}
          </main>

          {/* Right — timer, video, links */}
          <aside className="problem-side-rail">
            <div className="glass-card timer-side-card">
              <h4 className="cell-title">{NAV_EMOJI.timer} Focus Timer</h4>

              {session.showStartedMsg && (
                <div className="auto-start-banner started">
                  Looks like you&apos;ve started — timer is running!
                  <button type="button" className="auto-start-dismiss" onClick={session.dismissStartedMsg}>✕</button>
                </div>
              )}

              {!session.autoStartCancelled && !session.interviewTimer.running && session.autoStartLeft > 0 && (
                <div className="auto-start-banner pending">
                  <span>Timer auto-starts in {session.autoStartLeft}s</span>
                  <div className="auto-start-actions">
                    <button type="button" className="auto-start-btn primary" onClick={session.startNow}>Start now</button>
                    <button type="button" className="auto-start-btn" onClick={session.cancelAutoStart}>Cancel</button>
                  </div>
                </div>
              )}

              {insights?.you?.lastSessionSeconds ? (
                <p className="last-session-hint">
                  Last session: {Math.max(1, Math.round(insights.you.lastSessionSeconds / 60))} min
                </p>
              ) : null}

              <ProblemTimer
                compact
                countdown={session.interviewTimer}
                onPlay={session.onTimerPlay}
                onStop={session.onTimerStop}
                onReset={session.onTimerReset}
              />
            </div>

            <div className="glass-card collab-side-card">
              <h4 className="cell-title">{NAV_EMOJI.collab} Collab</h4>
              <CollabPanel sheet={sheet} defaultSlug={slug} compact />
            </div>

            {videoId && (
              <div className="glass-card video-card-compact">
                <h4 className="cell-title">{NAV_EMOJI.video} Video</h4>
                <div className="yt-embed-compact">
                  <iframe
                    title="YouTube"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {links.length > 0 && (
              <div className="glass-card resources-side-card">
                <h4 className="cell-title">{NAV_EMOJI.links} Resources</h4>
                <div className="resource-stack">
                  {links.map((l) => (
                    <ResourceLink key={l.title} href={l.href} icon={l.icon} title={l.title} sub={l.sub} variant={l.variant} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        <InterviewProgressBar remaining={session.interviewTimer.remaining} />

        <div className="glass-card problem-time-section">
          <h4 className="cell-title">📊 Time & community insights</h4>
          <ProblemInsights insights={insights} />
          <ProblemTimeChart history={timeHistory} demo={timeDemo} />
        </div>
      </div>

      <CongratsModal open={congrats} coins={5} onClose={() => setCongrats(false)} />
    </DonezoShell>
  );
}
