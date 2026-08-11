'use client';

import { ImagePlus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { BLOG_COVER_ACCEPT } from '@/types/blog';

type BlogCoverFieldProps = {
  file: File | null;
  existingUrl?: string | null;
  error?: string | null;
  onChange: (file: File | null) => void;
};

export function BlogCoverField({
  file,
  existingUrl = null,
  error,
  onChange,
}: BlogCoverFieldProps) {
  const t = useTranslations('blog.editor');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const objectUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewSrc = objectUrl ?? existingUrl;
  const hasPreview = Boolean(previewSrc);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const clearCover = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={BLOG_COVER_ACCEPT}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />

      {hasPreview && previewSrc ? (
        <div className="relative max-w-md overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-elevated">
          <div className="relative aspect-[16/10]">
            <AppImage
              src={previewSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
            <button
              type="button"
              onClick={openPicker}
              className="rounded-[var(--radius-sm)] bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm transition-opacity hover:opacity-90"
            >
              {t('changeCover')}
            </button>
            {file ? (
              <button
                type="button"
                onClick={clearCover}
                className="rounded-full bg-background/90 p-1.5 text-foreground backdrop-blur-sm transition-opacity hover:opacity-90"
                aria-label={t('removeCover')}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex aspect-[16/10] w-full max-w-md flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border bg-surface text-muted transition-colors hover:border-border-strong hover:bg-surface-elevated hover:text-foreground"
        >
          <ImagePlus className="size-7" aria-hidden="true" />
          <span className="text-sm font-medium">{t('addCover')}</span>
          <span className="text-xs text-subtle">{t('coverFormats')}</span>
        </button>
      )}

      {existingUrl && !file ? (
        <p className="text-xs text-muted">{t('coverKeepHint')}</p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
