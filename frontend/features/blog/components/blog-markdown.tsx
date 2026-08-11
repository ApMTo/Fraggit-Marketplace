'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
};

type BlogMarkdownProps = {
  content: string;
  className?: string;
};


export function BlogMarkdown({ content, className = '' }: BlogMarkdownProps) {
  return (
    <div
      className={`blog-prose space-y-4 text-base leading-relaxed text-foreground [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_code]:rounded [&_code]:bg-surface-elevated [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:text-muted [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ href, children }) => {
            const isExternal = href?.startsWith('http');
            if (isExternal) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            }
            if (href?.startsWith('/')) {
              return <Link href={href}>{children}</Link>;
            }
            return <a href={href}>{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
