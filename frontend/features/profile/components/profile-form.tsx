'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { Camera, Star, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProfile } from '@/hooks/use-users';
import { resolveApiError } from '@/lib/api-errors';
import {
  validateBio,
  validateDisplayName,
  validateUsername,
} from '@/lib/validation/auth';
import type { UserPublicProfile } from '@/types/user';
import {
  PROFILE_AVATAR_ACCEPT,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_BIO_MAX_LENGTH,
} from '@/types/user';

type ProfileFormValues = {
  username: string;
  displayName: string;
  bio: string;
  avatar: File | null;
};

type ProfileFormProps = {
  profile: UserPublicProfile;
  email: string;
  onUsernameChange?: (username: string) => void;
};

export function ProfileForm({
  profile,
  email,
  onUsernameChange,
}: ProfileFormProps) {
  const t = useTranslations('profile');
  const tFields = useTranslations('auth.fields');
  const tValidation = useTranslations('auth.validation');
  const tProfileValidation = useTranslations('profile.validation');
  const tErrors = useTranslations('errors');
  const updateProfile = useUpdateProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const formik = useFormik<ProfileFormValues>({
    enableReinitialize: true,
    initialValues: {
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio ?? '',
      avatar: null,
    },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof ProfileFormValues, string>> = {};

      const usernameError = validateUsername(values.username);
      if (usernameError) {
        errors.username = tValidation(usernameError);
      }

      const displayNameError = validateDisplayName(values.displayName);
      if (displayNameError) {
        errors.displayName = tValidation(displayNameError);
      }

      const bioError = validateBio(values.bio, PROFILE_BIO_MAX_LENGTH);
      if (bioError) {
        errors.bio = tProfileValidation(bioError);
      }

      if (values.avatar instanceof File) {
        if (values.avatar.size > PROFILE_AVATAR_MAX_BYTES) {
          errors.avatar = tProfileValidation('avatarSize');
        } else if (
          !PROFILE_AVATAR_ACCEPT.split(',').includes(values.avatar.type)
        ) {
          errors.avatar = tProfileValidation('avatarType');
        }
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus, setFieldValue }) => {
      setStatus(undefined);

      try {
        const previousUsername = profile.username;
        const updated = await updateProfile.mutateAsync({
          username: values.username.trim().toLowerCase(),
          displayName: values.displayName.trim(),
          bio: values.bio.trim() || null,
          ...(values.avatar instanceof File ? { avatar: values.avatar } : {}),
        });

        void setFieldValue('avatar', null);
        if (avatarInputRef.current) {
          avatarInputRef.current.value = '';
        }

        toast.success(t('saveSuccess'));

        if (
          onUsernameChange &&
          updated.user.username.toLowerCase() !== previousUsername.toLowerCase()
        ) {
          onUsernameChange(updated.user.username);
        }
      } catch (error) {
        const resolved = resolveApiError(error);
        setStatus({
          formError: tErrors(resolved.key, resolved.values),
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const clearFormError = () => {
    if (formik.status?.formError) {
      formik.setStatus(undefined);
    }
  };

  const previewUrl = useAvatarPreview(formik.values.avatar, profile.avatarUrl);
  const bioLength = formik.values.bio.length;
  const ratingLabel =
    profile.ratingCount > 0
      ? t('stats.ratingValue', {
          rating: profile.rating.toFixed(1),
          count: profile.ratingCount,
        })
      : t('stats.noRating');

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"
      noValidate
    >
      <aside className="space-y-6">
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="group relative size-28 overflow-hidden rounded-full border border-border bg-surface-elevated outline-none transition-[box-shadow,border-color] focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--blue-a24)]"
            aria-label={t('fields.changeAvatar')}
          >
            {previewUrl ? (
              <AppImage
                src={previewUrl}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-subtle">
                <UserRound className="size-10" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-6" />
            </span>
          </button>

          <input
            ref={avatarInputRef}
            id="profile-avatar"
            type="file"
            accept={PROFILE_AVATAR_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              clearFormError();
              const file = event.target.files?.[0] ?? null;
              void formik.setFieldValue('avatar', file);
              void formik.setFieldTouched('avatar', true, false);
            }}
          />

          <div className="space-y-1 text-center lg:text-left">
            <p className="font-medium text-foreground">{profile.displayName}</p>
            <p className="text-sm text-subtle">@{profile.username}</p>
          </div>

          {formik.touched.avatar && formik.errors.avatar ? (
            <p className="text-xs text-destructive">{formik.errors.avatar}</p>
          ) : (
            <p className="text-xs text-subtle">{t('fields.avatarHint')}</p>
          )}
        </div>

        <dl className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <dt className="text-muted">{t('stats.rating')}</dt>
            <dd className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="size-3.5 fill-current text-brand-cyan" />
              {ratingLabel}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">{t('stats.sales')}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {profile.successfulSales}
            </dd>
          </div>
        </dl>
      </aside>

      <div className="space-y-5">
        {formik.status?.formError ? (
          <FormError>{formik.status.formError}</FormError>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="profile-email">{tFields('email')}</Label>
          <Input
            id="profile-email"
            value={email}
            disabled
            readOnly
          />
          <p className="text-xs text-subtle">{t('fields.emailHint')}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-displayName">
              {tFields('displayName')}
            </Label>
            <Input
              id="profile-displayName"
              name="displayName"
              autoComplete="nickname"
              value={formik.values.displayName}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
              onBlur={formik.handleBlur}
              hasError={Boolean(
                formik.touched.displayName && formik.errors.displayName,
              )}
            />
            {formik.touched.displayName && formik.errors.displayName ? (
              <p className="text-xs text-destructive">
                {formik.errors.displayName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-username">{tFields('username')}</Label>
            <Input
              id="profile-username"
              name="username"
              autoComplete="username"
              value={formik.values.username}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
              onBlur={formik.handleBlur}
              hasError={Boolean(
                formik.touched.username && formik.errors.username,
              )}
            />
            {formik.touched.username && formik.errors.username ? (
              <p className="text-xs text-destructive">
                {formik.errors.username}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="profile-bio">{t('fields.bio')}</Label>
            <span
              className={`text-xs tabular-nums ${
                bioLength > PROFILE_BIO_MAX_LENGTH
                  ? 'text-destructive'
                  : 'text-subtle'
              }`}
            >
              {bioLength}/{PROFILE_BIO_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id="profile-bio"
            name="bio"
            rows={5}
            maxLength={PROFILE_BIO_MAX_LENGTH + 50}
            placeholder={t('fields.bioPlaceholder')}
            value={formik.values.bio}
            onChange={(event) => {
              clearFormError();
              formik.handleChange(event);
            }}
            onBlur={formik.handleBlur}
            hasError={Boolean(formik.touched.bio && formik.errors.bio)}
          />
          {formik.touched.bio && formik.errors.bio ? (
            <p className="text-xs text-destructive">{formik.errors.bio}</p>
          ) : (
            <p className="text-xs text-subtle">{t('fields.bioHint')}</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={formik.isSubmitting}>
            {t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}

function useAvatarPreview(
  file: File | null,
  currentUrl: string | null,
): string | null {
  const [filePreview, setFilePreview] = useState<{
    file: File;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    let cancelled = false;
    const reader = new FileReader();

    reader.onload = () => {
      if (!cancelled && typeof reader.result === 'string') {
        setFilePreview({ file, url: reader.result });
      }
    };

    reader.readAsDataURL(file);

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) {
    return currentUrl;
  }

  return filePreview?.file === file ? filePreview.url : null;
}
