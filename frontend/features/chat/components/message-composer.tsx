'use client';

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MessageComposerProps = {
  disabled?: boolean;
  isSending?: boolean;
  onSend: (content: string) => Promise<void> | void;
};

const MAX_LENGTH = 2000;

export function MessageComposer({
  disabled = false,
  isSending = false,
  onSend,
}: MessageComposerProps) {
  const t = useTranslations('chat');
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled && !isSending;

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) {
      return;
    }

    const content = trimmed;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSend(content);
    } catch {
      setValue(content);
    } finally {
      // Keep typing focus after send (do not disable textarea during send).
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex items-end gap-2 border-t border-border bg-surface px-3 py-3"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={t('composer.placeholder')}
        aria-label={t('composer.placeholder')}
        className={cn(
          'max-h-[140px] min-h-11 w-full resize-none rounded-[var(--radius-sm)] border border-input-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-placeholder transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-a24)] disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />

      <Button
        type="submit"
        size="sm"
        className="h-11 shrink-0 px-3"
        disabled={!canSend}
        isLoading={isSending}
        aria-label={t('composer.send')}
      >
        {!isSending ? <SendHorizontal className="size-4" /> : null}
        <span className="sr-only sm:not-sr-only">{t('composer.send')}</span>
      </Button>
    </form>
  );
}
