import ReactMarkdown from "react-markdown";

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-brand-800 prose-a:text-primary-700 prose-strong:text-brand-900 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50 prose-blockquote:not-italic prose-blockquote:rounded-r-xl prose-blockquote:py-1 ${className}`}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
