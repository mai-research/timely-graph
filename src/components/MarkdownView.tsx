import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/data";

export default function MarkdownView({ text, sources }: { text: string; sources: Source[] }) {
  const titles = new Map(sources.map((s) => [s.id, s.title ?? s.filename ?? s.id]));
  const withCites = text.replace(/\[(source_\d{3})\]/g, (_m, id) => `[${id}](#${id})`);
  return (
    <div className="prose-report max-w-4xl text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
        a: ({ href, children }) => href?.startsWith("#source_")
          ? <span className="cite" title={titles.get(href.slice(1))}>{children}</span>
          : <a href={href} rel="noreferrer">{children}</a>,
        img: ({ alt }) => <span className="text-muted-foreground">{alt || "Source figure"} (not included)</span>,
        table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
      }}>{withCites}</ReactMarkdown>
    </div>
  );
}
