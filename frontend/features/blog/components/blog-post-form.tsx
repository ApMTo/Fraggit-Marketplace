'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlogCoverField } from '@/features/blog/components/blog-cover-field';
import { BlogMarkdownEditor } from '@/features/blog/components/blog-markdown-editor';
import { useBlogMutations } from '@/hooks/use-blog';
import { locales, type Locale } from '@/i18n/config';
import { localeLabels, localeShortLabels } from '@/lib/theme';
import {
  BLOG_COVER_MAX_BYTES,
  emptyLocalizedBlogText,
  type BlogPostEditorDetail,
  type LocalizedBlogText,
} from '@/types/blog';

type BlogPostFormProps = {
  mode: 'create' | 'edit';
  post?: BlogPostEditorDetail;
};

function updateLocaleField(
  current: LocalizedBlogText,
  locale: Locale,
  value: string,
): LocalizedBlogText {
  return { ...current, [locale]: value };
}

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const t = useTranslations('blog.editor');
  const router = useRouter();
  const { createMutation, updateMutation, deleteMutation } = useBlogMutations();

  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [title, setTitle] = useState<LocalizedBlogText>(
    post?.translations.title ?? emptyLocalizedBlogText(),
  );
  const [content, setContent] = useState<LocalizedBlogText>(
    post?.translations.content ?? emptyLocalizedBlogText(),
  );
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [cover, setCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [localeError, setLocaleError] = useState<string | null>(null);

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const onCoverChange = (file: File | null) => {
    setCoverError(null);

    if (!file) {
      setCover(null);
      return;
    }

    if (file.size > BLOG_COVER_MAX_BYTES) {
      setCoverError(t('coverTooLarge'));
      setCover(null);
      return;
    }

    setCover(file);
  };

  const validateLocales = (): boolean => {
    for (const locale of locales) {
      if (title[locale].trim().length < 3 || !content[locale].trim()) {
        setLocaleError(t('localeRequired', { locale: localeLabels[locale] }));
        setActiveLocale(locale);
        return false;
      }
    }

    setLocaleError(null);
    return true;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateLocales()) {
      return;
    }

    if (mode === 'create' && !cover) {
      setCoverError(t('coverRequired'));
      return;
    }

    const trimmedTitle = {
      en: title.en.trim(),
      ru: title.ru.trim(),
    };
    const trimmedContent = {
      en: content.en.trim(),
      ru: content.ru.trim(),
    };

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync({
          title: trimmedTitle,
          content: trimmedContent,
          slug: slug.trim() || undefined,
          cover: cover!,
        });
        toast.success(t('createSuccess'));
        router.push(`/blog/${created.slug}`);
        return;
      }

      if (!post) {
        return;
      }

      const updated = await updateMutation.mutateAsync({
        id: post.id,
        payload: {
          title: trimmedTitle,
          content: trimmedContent,
          slug: slug.trim() || undefined,
          cover,
        },
      });
      toast.success(t('updateSuccess'));
      router.push(`/blog/${updated.slug}`);
    } catch {
      toast.error(mode === 'create' ? t('createError') : t('updateError'));
    }
  };

  const onDelete = async () => {
    if (!post) {
      return;
    }

    const confirmed = window.confirm(t('deleteConfirm'));
    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(post.id);
      toast.success(t('deleteSuccess'));
      router.push('/blog');
    } catch {
      toast.error(t('deleteError'));
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="blog-slug">{t('slug')}</Label>
        <Input
          id="blog-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          maxLength={200}
          placeholder={t('slugPlaceholder')}
        />
        <p className="text-xs text-muted">{t('slugHint')}</p>
      </div>

      <div className="space-y-2">
        <Label>{t('cover')}</Label>
        <BlogCoverField
          file={cover}
          existingUrl={mode === 'edit' ? post?.coverUrl : null}
          error={coverError}
          onChange={onCoverChange}
        />
      </div>

      <div className="space-y-3">
        <div
          role="tablist"
          aria-label={t('localeTabsLabel')}
          className="flex flex-wrap gap-2 border-b border-border pb-3"
        >
          {locales.map((locale) => {
            const selected = activeLocale === locale;
            const filled =
              title[locale].trim().length >= 3 && Boolean(content[locale].trim());

            return (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveLocale(locale)}
                className={
                  selected
                    ? 'rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground'
                    : 'rounded-[var(--radius-md)] bg-surface-elevated px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground'
                }
              >
                {localeShortLabels[locale]}
                {!filled ? (
                  <span className="ml-1.5 text-xs opacity-60">*</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {localeError ? (
          <p className="text-sm text-destructive">{localeError}</p>
        ) : (
          <p className="text-xs text-muted">{t('localeTabsHint')}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor={`blog-title-${activeLocale}`}>
            {t('title')} ({localeLabels[activeLocale]})
          </Label>
          <Input
            id={`blog-title-${activeLocale}`}
            value={title[activeLocale]}
            onChange={(event) =>
              setTitle(
                updateLocaleField(title, activeLocale, event.target.value),
              )
            }
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`blog-content-${activeLocale}`}>
            {t('content')} ({localeLabels[activeLocale]})
          </Label>
          <BlogMarkdownEditor
            id={`blog-content-${activeLocale}`}
            value={content[activeLocale]}
            onChange={(value) =>
              setContent(updateLocaleField(content, activeLocale, value))
            }
            required
            placeholder={t('contentPlaceholder')}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t('saving')
            : mode === 'create'
              ? t('create')
              : t('save')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => router.back()}
        >
          {t('cancel')}
        </Button>
        {mode === 'edit' && post ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => void onDelete()}
          >
            {t('delete')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
