'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { ArrowLeft, ImagePlus, Package, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { AppImage } from '@/components/ui/app-image';
import { LotAttributeFields } from '@/features/listings/components/lot-attribute-fields';
import {
  buildAttributeInputs,
  emptyAttributeValue,
  hasAttributeValue,
  parseStoredAttributeValue,
} from '@/features/listings/lib/lot-attributes';
import {
  useCategories,
  useListingFilterAttributes,
  useLot,
  useSubcategories,
  useUpdateLot,
} from '@/hooks';
import { resolveApiError } from '@/lib/api-errors';
import { useAuth } from '@/providers/AuthProvider';
import type { AttributeDefinitionPublic } from '@/types/category';
import type { LotAttributeInputValue, LotDetail, LotImage } from '@/types/lot';
import {
  LOT_PHOTO_ACCEPT,
  LOT_PHOTO_MAX_BYTES,
  MAX_LOT_PHOTOS,
} from '@/types/lot';

type EditLotFormValues = {
  title: string;
  description: string;
  price: string;
  stock: string;
  serviceQuestion: string;
  attributes: Record<string, LotAttributeInputValue>;
  keepImages: LotImage[];
  preview: File | null;
  photos: File[];
};

type EditLotPageProps = {
  lotId: string;
  categorySlug: string;
  subcategorySlug: string;
};

function buildInitialValues(
  lot: LotDetail,
  attributeDefinitions: AttributeDefinitionPublic[],
): EditLotFormValues {
  const storedByAttributeId = new Map(
    lot.attributes.map((item) => [item.attributeId, item.value]),
  );

  const nextAttributes: Record<string, LotAttributeInputValue> = {};
  for (const definition of attributeDefinitions) {
    const stored = storedByAttributeId.get(definition.id);
    nextAttributes[definition.id] =
      stored != null
        ? parseStoredAttributeValue(definition.type, stored)
        : emptyAttributeValue(definition.type);
  }

  return {
    title: lot.title,
    description: lot.description ?? '',
    price: String(lot.price),
    stock: String(lot.stock),
    serviceQuestion: lot.serviceQuestion ?? '',
    attributes: nextAttributes,
    keepImages: [...lot.images].sort((a, b) => a.sortOrder - b.sortOrder),
    preview: null,
    photos: [],
  };
}

export function EditLotPage({
  lotId,
  categorySlug,
  subcategorySlug,
}: EditLotPageProps) {
  const t = useTranslations('listings.edit');
  const tListings = useTranslations('listings');
  const { user, isLoading: authLoading } = useAuth();
  const { data: lot, isLoading: lotLoading, isError } = useLot(lotId);
  const lotHref = `/listings/${categorySlug}/${subcategorySlug}/lot/${lotId}`;

  const { data: categories } = useCategories();
  const { data: subcategories } = useSubcategories(lot?.categoryId ?? null);
  const { data: attributes, isLoading: attributesLoading } =
    useListingFilterAttributes(lot?.subcategoryId ?? null);

  const attributeDefinitions = useMemo(
    () => attributes ?? [],
    [attributes],
  );

  const categoryName =
    categories?.find((item) => item.id === lot?.categoryId)?.name ??
    categorySlug;
  const subcategoryName =
    subcategories?.find((item) => item.id === lot?.subcategoryId)?.name ??
    subcategorySlug;

  if (authLoading || lotLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[760px] justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !lot) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={tListings('lotNotFoundTitle')}
          description={tListings('lotNotFoundDescription')}
          action={
            <Link
              href={`/listings/${categorySlug}/${subcategorySlug}`}
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {tListings('backToListings')}
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = Boolean(user && user.id === lot.sellerId);

  if (!isOwner) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={t('notOwnerTitle')}
          description={t('notOwnerDescription')}
          action={
            <Link
              href={lotHref}
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('back')}
            </Link>
          }
        />
      </div>
    );
  }

  if (lot.status !== 'OPEN') {
    return (
      <div className="mx-auto w-full max-w-[760px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={t('notEditableTitle')}
          description={t('notEditableDescription')}
          action={
            <Link
              href={lotHref}
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('back')}
            </Link>
          }
        />
      </div>
    );
  }

  if (attributesLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[760px] justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <EditLotForm
      lot={lot}
      lotId={lotId}
      lotHref={lotHref}
      categoryName={categoryName}
      subcategoryName={subcategoryName}
      attributeDefinitions={attributeDefinitions}
    />
  );
}

type EditLotFormProps = {
  lot: LotDetail;
  lotId: string;
  lotHref: string;
  categoryName: string;
  subcategoryName: string;
  attributeDefinitions: AttributeDefinitionPublic[];
};

function EditLotForm({
  lot,
  lotId,
  lotHref,
  categoryName,
  subcategoryName,
  attributeDefinitions,
}: EditLotFormProps) {
  const t = useTranslations('listings.edit');
  const tCreate = useTranslations('listings.create');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const updateLot = useUpdateLot();
  const previewInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const initialValues = useMemo(
    () => buildInitialValues(lot, attributeDefinitions),
    [lot, attributeDefinitions],
  );

  const formik = useFormik<EditLotFormValues>({
    initialValues,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Record<string, unknown> = {};

      if (values.title.trim().length < 3) {
        errors.title = tCreate('validation.titleMin');
      } else if (values.title.trim().length > 200) {
        errors.title = tCreate('validation.titleMax');
      }

      if (values.description.length > 5000) {
        errors.description = tCreate('validation.descriptionMax');
      }

      const priceRaw = String(values.price ?? '').trim();
      const price = Number(priceRaw);
      if (!priceRaw || !Number.isFinite(price) || price < 1) {
        errors.price = tCreate('validation.priceMin');
      }

      const stockRaw = String(values.stock ?? '').trim();
      const stock = Number(stockRaw);
      if (!stockRaw || !Number.isInteger(stock) || stock < 1) {
        errors.stock = tCreate('validation.stockMin');
      }

      if (lot.type === 'SERVICE') {
        if (values.serviceQuestion.trim().length < 1) {
          errors.serviceQuestion = tCreate(
            'validation.serviceQuestionRequired',
          );
        } else if (values.serviceQuestion.trim().length > 2000) {
          errors.serviceQuestion = tCreate('validation.serviceQuestionMax');
        }
      }

      const attributeErrors: Record<string, string> = {};
      for (const definition of attributeDefinitions) {
        const value = values.attributes[definition.id];
        if (definition.required && !hasAttributeValue(value ?? '')) {
          attributeErrors[definition.id] = tCreate(
            'validation.attributeRequired',
          );
        }
      }
      if (Object.keys(attributeErrors).length > 0) {
        errors.attributes = attributeErrors;
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        await updateLot.mutateAsync({
          id: lotId,
          payload: {
            title: values.title.trim(),
            description: values.description.trim() || null,
            price: Number(values.price),
            stock: Number(values.stock),
            serviceQuestion:
              lot.type === 'SERVICE' ? values.serviceQuestion.trim() : null,
            attributes: buildAttributeInputs(
              attributeDefinitions,
              values.attributes,
            ),
            keepImageIds: values.keepImages.map((image) => image.id),
            preview: values.preview,
            photos: values.photos,
          },
        });

        toast.success(t('success'));
        router.push(lotHref);
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

  const { setFieldValue } = formik;

  function clearFormError() {
    if (formik.status?.formError) {
      formik.setStatus(undefined);
    }
  }

  function handlePreviewSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    clearFormError();
    const acceptedTypes = new Set(LOT_PHOTO_ACCEPT.split(','));

    if (!acceptedTypes.has(file.type)) {
      formik.setStatus({ formError: tCreate('validation.photoType') });
    } else if (file.size > LOT_PHOTO_MAX_BYTES) {
      formik.setStatus({ formError: tCreate('validation.photoSize') });
    } else {
      void setFieldValue('preview', file);
    }

    if (previewInputRef.current) {
      previewInputRef.current.value = '';
    }
  }

  function removePreview() {
    clearFormError();
    void setFieldValue('preview', null);
  }

  function handlePhotosSelected(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    clearFormError();
    const incoming = Array.from(fileList);
    const next = [...formik.values.photos];
    const acceptedTypes = new Set(LOT_PHOTO_ACCEPT.split(','));
    const remainingSlots =
      MAX_LOT_PHOTOS -
      formik.values.keepImages.length -
      formik.values.photos.length;

    for (const file of incoming) {
      if (next.length >= formik.values.photos.length + remainingSlots) {
        break;
      }
      if (!acceptedTypes.has(file.type)) {
        formik.setStatus({ formError: tCreate('validation.photoType') });
        continue;
      }
      if (file.size > LOT_PHOTO_MAX_BYTES) {
        formik.setStatus({ formError: tCreate('validation.photoSize') });
        continue;
      }
      next.push(file);
    }

    void setFieldValue('photos', next);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }

  function removeKeepImage(imageId: string) {
    clearFormError();
    void setFieldValue(
      'keepImages',
      formik.values.keepImages.filter((image) => image.id !== imageId),
    );
  }

  function removePhoto(index: number) {
    clearFormError();
    void setFieldValue(
      'photos',
      formik.values.photos.filter((_, i) => i !== index),
    );
  }

  const attributeErrors =
    (formik.errors.attributes as Record<string, string> | undefined) ?? {};
  const attributeTouched =
    (formik.touched.attributes as Record<string, boolean> | undefined) ?? {};
  const totalPhotos =
    formik.values.keepImages.length + formik.values.photos.length;
  const canAddPhotos = totalPhotos < MAX_LOT_PHOTOS;
  const currentPreviewUrl = lot.previewUrl;

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 py-10">
      <header className="space-y-4">
        <Link
          href={lotHref}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('back')}
        </Link>
        <div className="space-y-1">
          <h1 className="page-title text-3xl">{t('title')}</h1>
          <p className="text-sm text-subtle">{t('subtitle')}</p>
        </div>
      </header>

      <form
        onSubmit={formik.handleSubmit}
        className="surface-card space-y-6 rounded-[var(--radius-lg)] p-5 sm:p-6"
        noValidate
      >
        {formik.status?.formError ? (
          <FormError>{formik.status.formError}</FormError>
        ) : null}

        <section className="space-y-4">
          <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
            {tCreate('sectionBasics')}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="edit-lot-title">{tCreate('fields.title')}</Label>
            <Input
              id="edit-lot-title"
              name="title"
              value={formik.values.title}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
              onBlur={formik.handleBlur}
              hasError={Boolean(formik.touched.title && formik.errors.title)}
            />
            {formik.touched.title && formik.errors.title ? (
              <p className="text-xs text-destructive">{formik.errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-lot-description">
              {tCreate('fields.description')}
            </Label>
            <Textarea
              id="edit-lot-description"
              name="description"
              value={formik.values.description}
              onChange={(event) => {
                clearFormError();
                formik.handleChange(event);
              }}
              onBlur={formik.handleBlur}
              hasError={Boolean(
                formik.touched.description && formik.errors.description,
              )}
              rows={5}
            />
            {formik.touched.description && formik.errors.description ? (
              <p className="text-xs text-destructive">
                {formik.errors.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-lot-price">{tCreate('fields.price')}</Label>
              <Input
                id="edit-lot-price"
                name="price"
                type="number"
                min={1}
                step="0.01"
                value={formik.values.price}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(formik.touched.price && formik.errors.price)}
              />
              {formik.touched.price && formik.errors.price ? (
                <p className="text-xs text-destructive">{formik.errors.price}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lot-stock">{tCreate('fields.stock')}</Label>
              <Input
                id="edit-lot-stock"
                name="stock"
                type="number"
                min={1}
                step={1}
                value={formik.values.stock}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(formik.touched.stock && formik.errors.stock)}
              />
              {formik.touched.stock && formik.errors.stock ? (
                <p className="text-xs text-destructive">{formik.errors.stock}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1 rounded-[var(--radius-md)] border border-border bg-surface-elevated px-3 py-2.5">
            <p className="text-xs text-muted">{tCreate('fields.type')}</p>
            <p className="text-sm font-medium text-foreground">
              {lot.type === 'SERVICE'
                ? tCreate('typeService')
                : tCreate('typeAccount')}
            </p>
            <p className="text-xs text-subtle">{t('typeLocked')}</p>
          </div>

          {lot.type === 'SERVICE' ? (
            <div className="space-y-2">
              <Label htmlFor="edit-lot-service-question">
                {tCreate('fields.serviceQuestion')}
              </Label>
              <Textarea
                id="edit-lot-service-question"
                name="serviceQuestion"
                value={formik.values.serviceQuestion}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(
                  formik.touched.serviceQuestion &&
                    formik.errors.serviceQuestion,
                )}
                rows={4}
                placeholder={tCreate('serviceQuestionPlaceholder')}
              />
              {formik.touched.serviceQuestion &&
              formik.errors.serviceQuestion ? (
                <p className="text-xs text-destructive">
                  {formik.errors.serviceQuestion}
                </p>
              ) : (
                <p className="text-xs text-subtle">
                  {tCreate('serviceQuestionHint')}
                </p>
              )}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
            {tCreate('sectionCategory')}
          </h2>
          <p className="text-xs text-subtle">{t('categoryLocked')}</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 rounded-[var(--radius-md)] border border-border bg-surface-elevated px-3 py-2.5">
              <dt className="text-xs text-muted">{tCreate('fields.category')}</dt>
              <dd className="text-sm font-medium text-foreground">
                {categoryName}
              </dd>
            </div>
            <div className="space-y-1 rounded-[var(--radius-md)] border border-border bg-surface-elevated px-3 py-2.5">
              <dt className="text-xs text-muted">
                {tCreate('fields.subcategory')}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {subcategoryName}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
            {tCreate('sectionAttributes')}
          </h2>
          {attributeDefinitions.length === 0 ? (
            <p className="text-xs text-subtle">{tCreate('noAttributes')}</p>
          ) : (
            <LotAttributeFields
              attributes={attributeDefinitions}
              values={formik.values.attributes}
              errors={attributeErrors}
              touched={attributeTouched}
              onChange={(attributeId, value) => {
                clearFormError();
                void setFieldValue(`attributes.${attributeId}`, value);
              }}
              onBlur={(attributeId) => {
                void formik.setFieldTouched(`attributes.${attributeId}`, true);
              }}
            />
          )}
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div className="space-y-1">
            <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
              {tCreate('sectionPreview')}
            </h2>
            <p className="text-xs text-subtle">{tCreate('previewHint')}</p>
          </div>

          <input
            ref={previewInputRef}
            type="file"
            accept={LOT_PHOTO_ACCEPT}
            className="sr-only"
            onChange={(event) => handlePreviewSelected(event.target.files)}
          />

          <div className="max-w-xs">
            {formik.values.preview ? (
              <FilePhotoThumb
                file={formik.values.preview}
                onRemove={removePreview}
                removeLabel={tCreate('removePreview')}
                aspectClassName="aspect-[16/10]"
              />
            ) : currentPreviewUrl ? (
              <div className="space-y-2">
                <UrlPhotoThumb
                  url={currentPreviewUrl}
                  aspectClassName="aspect-[16/10]"
                />
                <button
                  type="button"
                  onClick={() => previewInputRef.current?.click()}
                  className="text-xs font-medium text-[var(--link)] transition-colors hover:text-foreground"
                >
                  {t('replacePreview')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => previewInputRef.current?.click()}
                className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                <span className="text-xs">{tCreate('addPreview')}</span>
              </button>
            )}
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
              {tCreate('sectionPhotos')}
            </h2>
            <p className="text-xs text-subtle">
              {tCreate('photosHint', { max: MAX_LOT_PHOTOS })}
            </p>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept={LOT_PHOTO_ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => handlePhotosSelected(event.target.files)}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {formik.values.keepImages.map((image) => (
              <UrlPhotoThumb
                key={image.id}
                url={image.url}
                onRemove={() => removeKeepImage(image.id)}
                removeLabel={tCreate('removePhoto')}
              />
            ))}

            {formik.values.photos.map((photo, index) => (
              <FilePhotoThumb
                key={`${photo.name}-${photo.lastModified}-${index}`}
                file={photo}
                onRemove={() => removePhoto(index)}
                removeLabel={tCreate('removePhoto')}
              />
            ))}

            {canAddPhotos ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                <span className="text-xs">{tCreate('addPhoto')}</span>
              </button>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => router.push(lotHref)}>
            {tCreate('cancel')}
          </Button>
          <Button type="submit" isLoading={formik.isSubmitting}>
            {t('submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function UrlPhotoThumb({
  url,
  onRemove,
  removeLabel,
  aspectClassName = 'aspect-square',
}: {
  url: string;
  onRemove?: () => void;
  removeLabel?: string;
  aspectClassName?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-elevated ${aspectClassName}`}
    >
      <AppImage
        src={url}
        alt=""
        fill
        sizes="240px"
        className="object-cover"
      />
      {onRemove && removeLabel ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm"
          aria-label={removeLabel}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function FilePhotoThumb({
  file,
  onRemove,
  removeLabel,
  aspectClassName = 'aspect-square',
}: {
  file: File;
  onRemove: () => void;
  removeLabel: string;
  aspectClassName?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();

    reader.onload = () => {
      if (!cancelled && typeof reader.result === 'string') {
        setUrl(reader.result);
      }
    };

    reader.readAsDataURL(file);

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-elevated ${aspectClassName}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local File preview
        <img
          src={url}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm"
        aria-label={removeLabel}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
