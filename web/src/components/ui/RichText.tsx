import type { ReactNode } from 'react';

/** Text renderer for problem statements — paragraphs, bullets, bold */

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return <span key={j}>{part}</span>;
  });
}

export default function RichText({ text, className = '' }: { text: string; className?: string }) {
  if (!text?.trim()) return <p className="bento-empty">No description available.</p>;

  const blocks = text.includes('\n\n')
    ? text.split(/\n\n+/).flatMap((block) => block.split('\n'))
    : text.split('\n');

  const nodes: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length) {
      nodes.push(<ul key={`ul-${nodes.length}`} className="rich-list">{listItems}</ul>);
      listItems = [];
    }
  };

  blocks.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const bullet = trimmed.match(/^[-*•]\s+(.+)/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      listItems.push(<li key={i}>{renderInline((bullet || numbered)![1])}</li>);
      return;
    }

    flushList();
    if (trimmed.endsWith(':') && trimmed.length < 60) {
      nodes.push(<h5 key={i} className="rich-subhead">{trimmed}</h5>);
    } else {
      nodes.push(<p key={i}>{renderInline(trimmed)}</p>);
    }
  });
  flushList();

  return <div className={`rich-text problem-prose ${className}`}>{nodes}</div>;
}
