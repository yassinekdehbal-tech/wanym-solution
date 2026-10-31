import ReactMarkdown from "react-markdown";

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-brand-800 prose-a:text-brand-600 prose-strong:text-slate-900 ${className}`}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
