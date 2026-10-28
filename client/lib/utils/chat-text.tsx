import type { ReactNode } from "react";

const PATTERN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export const chatSafe = (value: string) => value.replace(/[*[\]()]/g, "");

export function renderChatText(text: string) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(PATTERN)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      match[1] !== undefined ? (
        <strong key={key++}>{match[1]}</strong>
      ) : (
        <a key={key++} href={match[3]} target="_blank" rel="noopener noreferrer" className="font-bold underline">{match[2]}</a>
      ),
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
