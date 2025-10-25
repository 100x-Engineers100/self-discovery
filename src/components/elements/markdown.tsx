import { type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Markdown = ({ content }: { content: string }) => (
  <div className="prose prose-sm prose-p:leading-normal break-words dark:prose-invert">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  </div>
);