'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, SendHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 2000;
const MAX_IMAGE_BYTES = 5_242_880;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type MessageComposerProps = {
  disabled?: boolean;
  isSending?: boolean;
  onSendText: (content: string) => Promise<void> | void;
  onSendImage: (file: File) => Promise<void> | void;
};

export function MessageComposer({
  disabled = false,
  isSending = false,
  onSendText,
  onSendImage,
}: MessageComposerProps) {
  const t = useTranslations('chat');
  const [value, setValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const trimmed = value.trim();
  const canSendText =
    trimmed.length > 0 && !disabled && !isSending && !pendingFile;
  const canSendImage = Boolean(pendingFile) && !disabled && !isSending;

  function clearPendingFile() {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleFileChange(file: File | undefined) {
    setLocalError(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setLocalError(t('composer.imageTypeError'));
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError(t('composer.imageSizeError'));
      return;
    }

    setPendingFile(file);
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled || isSending) {
      return;
    }

    if (pendingFile) {
      const file = pendingFile;
      clearPendingFile();
      setLocalError(null);

      try {
        await onSendImage(file);
      } catch {
        setPendingFile(file);
      } finally {
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      }
      return;
    }

    if (!canSendText) {
      return;
    }

    const content = trimmed;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendText(content);
    } catch {
      setValue(content);
    } finally {
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
      className="border-t border-border bg-surface"
    >
      {previewUrl ? (
        <div className="flex items-start gap-3 px-3 pt-3">
          <div className="relative size-16 overflow-hidden rounded-[var(--radius-sm)] border border-border">
            <AppImage
              src={previewUrl}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={clearPendingFile}
            disabled={isSending}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-subtle transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            aria-label={t('composer.removeImage')}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {localError ? (
        <p className="px-3 pt-2 text-xs text-destructive">{localError}</p>
      ) : null}

      <div className="flex items-end gap-2 px-3 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled || isSending}
          onChange={(event) => {
            handleFileChange(event.target.files?.[0]);
          }}
        />

        <button
          type="button"
          disabled={disabled || isSending}
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('composer.attachImage')}
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-input-border bg-input text-subtle transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="size-5" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          disabled={disabled || Boolean(pendingFile)}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={
            pendingFile ? t('composer.imageReady') : t('composer.placeholder')
          }
          aria-label={t('composer.placeholder')}
          className={cn(
            'max-h-[140px] min-h-11 w-full resize-none rounded-[var(--radius-sm)] border border-input-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-placeholder transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-a24)] disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />

        <Button
          type="submit"
          size="sm"
          className="h-11 shrink-0 px-3"
          disabled={!(canSendText || canSendImage)}
          isLoading={isSending}
          aria-label={t('composer.send')}
        >
          {!isSending ? <SendHorizontal className="size-4" /> : null}
          <span className="sr-only sm:not-sr-only">{t('composer.send')}</span>
        </Button>
      </div>
    </form>
  );
}
