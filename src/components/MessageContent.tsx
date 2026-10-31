import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`)/g;
  const output: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const pos = match.index ?? 0;
    if (pos > last) output.push(text.slice(last, pos));
    const key = `token-${pos}`;
    if (match[2] && match[3]) output.push(<a key={key} href={match[3]} rel="noopener noreferrer" target="_blank">{match[2]}</a>);
    else if (match[4]) output.push(<strong key={key}>{match[4]}</strong>);
    else if (match[5]) output.push(<em key={key}>{match[5]}</em>);
    else if (match[6]) output.push(<code key={key}>{match[6]}</code>);
    last = pos + match[0].length;
  }
  if (last < text.length) output.push(text.slice(last));
  return output;
}

export function MessageContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^```/.test(line)) {
      const language = line.replace(/^```/, '').trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(<pre key={blocks.length} className="answer-code" aria-label={language || 'Code'}><code>{code.join('\n')}</code></pre>);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const children = inline(heading[2]);
      blocks.push(heading[1].length === 1 ? <h2 dir="auto" key={blocks.length}>{children}</h2> : <h3 dir="auto" key={blocks.length}>{children}</h3>);
      i++; continue;
    }
    const bullet = line.match(/^\s*([-*]|\d+\.)\s+(.+)$/);
    if (bullet) {
      const ordered = /\d/.test(bullet[1]);
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const match = lines[i].match(/^\s*([-*]|\d+\.)\s+(.+)$/);
        if (!match || /\d/.test(match[1]) !== ordered) break;
        items.push(<li dir="auto" key={i}>{inline(match[2])}</li>);
        i++;
      }
      blocks.push(ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
      continue;
    }
    const paragraph: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|\s*([-*]|\d+\.)\s+)/.test(lines[i])) paragraph.push(lines[i++]);
    blocks.push(<p dir="auto" key={blocks.length}>{paragraph.map((part, index) => <span key={index}>{index > 0 ? <br/> : null}{inline(part)}</span>)}</p>);
  }
  return <div className="message-markdown" dir="auto">{blocks}</div>;
}
