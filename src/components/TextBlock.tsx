import ReactMarkdown from "react-markdown";

export default function TextBlock({ body }: { body: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
      <div className="prose prose-sm max-w-none text-muted prose-headings:font-serif prose-headings:text-ink prose-strong:text-ink prose-a:text-teal">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    </div>
  );
}
