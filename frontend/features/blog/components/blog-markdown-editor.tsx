'use client';

import { useCallback, useRef, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BlogMarkdown } from '@/features/blog/components/blog-markdown';

type InsertSnippet = {
  before?: string;
  after?: string;
  placeholder?: string;
  linePrefix?: string;
};

type BlogMarkdownEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
};

function insertAroundSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  snippet: InsertSnippet,
): { next: string; selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  if (snippet.linePrefix) {
    const block = selected || snippet.placeholder || '';
    const lines = block
      .split('\n')
      .map((line) => `${snippet.linePrefix}${line}`);
    const inserted = lines.join('\n');
    return {
      next: `${value.slice(0, start)}${inserted}${value.slice(end)}`,
      selectionStart: start,
      selectionEnd: start + inserted.length,
    };
  }

  const before = snippet.before ?? '';
  const after = snippet.after ?? '';
  const inner = selected || snippet.placeholder || '';
  const inserted = `${before}${inner}${after}`;

  return {
    next: `${value.slice(0, start)}${inserted}${value.slice(end)}`,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + inner.length,
  };
}

function ToolbarButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-8 px-2.5 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function BlogMarkdownEditor({
  id,
  value,
  onChange,
  required,
  placeholder,
}: BlogMarkdownEditorProps) {
  const t = useTranslations('blog.editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applySnippet = useCallback(
    (snippet: InsertSnippet) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const { next, selectionStart, selectionEnd } = insertAroundSelection(
        textarea,
        value,
        snippet,
      );
      onChange(next);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd);
      });
    },
    [onChange, value],
  );

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          label={t('toolbar.bold')}
          onClick={() =>
            applySnippet({
              before: '**',
              after: '**',
              placeholder: t('toolbar.placeholders.bold'),
            })
          }
        />
        <ToolbarButton
          label={t('toolbar.italic')}
          onClick={() =>
            applySnippet({
              before: '_',
              after: '_',
              placeholder: t('toolbar.placeholders.italic'),
            })
          }
        />
        <ToolbarButton
          label={t('toolbar.underline')}
          onClick={() =>
            applySnippet({
              before: '<u>',
              after: '</u>',
              placeholder: t('toolbar.placeholders.underline'),
            })
          }
        />
        <ToolbarButton
          label={t('toolbar.link')}
          onClick={() =>
            applySnippet({
              before: '[',
              after: '](https://)',
              placeholder: t('toolbar.placeholders.link'),
            })
          }
        />
        <ToolbarButton
          label={t('toolbar.heading')}
          onClick={() =>
            applySnippet({
              before: '## ',
              placeholder: t('toolbar.placeholders.heading'),
            })
          }
        />
        <ToolbarButton
          label={t('toolbar.list')}
          onClick={() =>
            applySnippet({
              linePrefix: '- ',
              placeholder: t('toolbar.placeholders.list'),
            })
          }
        />
      </div>

      <p className="text-xs text-muted">{t('linkHint')}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('writeTab')}
          </p>
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={handleChange}
            required={required}
            rows={18}
            placeholder={placeholder}
            className="min-h-[28rem] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('previewTab')}
          </p>
          <div className="min-h-[28rem] overflow-auto rounded-[var(--radius-md)] border border-border bg-surface px-4 py-4">
            {value.trim() ? (
              <BlogMarkdown content={value} />
            ) : (
              <p className="text-sm text-muted">{t('previewEmpty')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
