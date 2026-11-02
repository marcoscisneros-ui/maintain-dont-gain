import { Fragment } from "react";

/**
 * Very small formatter for posts, recipes and tips:
 *   "## Heading"   → heading
 *   "- item"       → bullet
 *   "1. step"      → numbered step
 *   "**bold**"     → bold
 *   blank line     → paragraph break
 * Links (https://...) become tappable.
 */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h4 key={i} className="mt-4 mb-1.5 text-sm font-bold tracking-wide text-brand uppercase first:mt-0">
          {inline(line.slice(3))}
        </h4>,
      );
      i++;
    } else if (/^[-•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-•]\s/, ""));
      blocks.push(
        <ul key={i} className="my-2 space-y-1.5">
          {items.map((t, k) => (
            <li key={k} className="flex gap-2.5">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>{inline(t)}</span>
            </li>
          ))}
        </ul>,
      );
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s/, ""));
      blocks.push(
        <ol key={i} className="my-2 space-y-2">
          {items.map((t, k) => (
            <li key={k} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/12 text-xs font-bold text-brand">
                {k + 1}
              </span>
              <span>{inline(t)}</span>
            </li>
          ))}
        </ol>,
      );
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(## |[-•]\s|\d+\.\s)/.test(lines[i])) para.push(lines[i++]);
      blocks.push(
        <p key={i} className="my-2 first:mt-0">
          {para.map((p, k) => (
            <Fragment key={k}>
              {k > 0 && <br />}
              {inline(p)}
            </Fragment>
          ))}
        </p>,
      );
    }
  }
  return <div className={`leading-relaxed ${className}`}>{blocks}</div>;
}

function inline(s: string): React.ReactNode[] {
  const parts = s.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
    if (/^https?:\/\//.test(p))
      return (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-brand underline">
          {p}
        </a>
      );
    return <Fragment key={i}>{p}</Fragment>;
  });
}
