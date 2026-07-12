'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { LotAttributeFields } from '@/features/listings/components/lot-attribute-fields';
import {
  buildAttributeInputs,
  emptyAttributeValue,
  hasAttributeValue,
} from '@/features/listings/lib/lot-attributes';
import {
  useCategories,
  useCreateLot,
  useListingFilterAttributes,
  useSubcategories,
} from '@/hooks';
import { resolveApiError } from '@/lib/api-errors';
import type { AttributeDefinitionPublic } from '@/types/category';
import type { LotAttributeInputValue } from '@/types/lot';
import {
  LOT_PHOTO_ACCEPT,
  LOT_PHOTO_MAX_BYTES,
  MAX_LOT_PHOTOS,
} from '@/types/lot';

type CreateLotFormValues = {
  title: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  subcategoryId: string;
  attributes: Record<string, LotAttributeInputValue>;
  preview: File | null;
  photos: File[];
};

export function CreateLotPage() {
  const t = useTranslations('listings.create');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const createLot = useCreateLot();
  const previewInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const presetCategoryId = searchParams.get('categoryId')?.trim() ?? '';
  const presetSubcategoryId = searchParams.get('subcategoryId')?.trim() ?? '';

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const attributesRef = useRef<AttributeDefinitionPublic[]>([]);
  const categorySlugRef = useRef<string | null>(null);
  const subcategorySlugRef = useRef<string | null>(null);

  const formik = useFormik<CreateLotFormValues>({
    initialValues: {
      title: '',
      description: '',
      price: '',
      stock: '1',
      categoryId: presetCategoryId,
      subcategoryId: presetSubcategoryId,
      attributes: {},
      preview: null,
      photos: [],
    },
    validateOnChange: false,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Record<string, unknown> = {};

      if (values.title.trim().length < 3) {
        errors.title = t('validation.titleMin');
      } else if (values.title.trim().length > 200) {
        errors.title = t('validation.titleMax');
      }

      if (values.description.length > 5000) {
        errors.description = t('validation.descriptionMax');
      }

      const priceRaw = String(values.price ?? '').trim();
      const price = Number(priceRaw);
      if (!priceRaw || !Number.isFinite(price) || price < 1) {
        errors.price = t('validation.priceMin');
      }

      const stockRaw = String(values.stock ?? '').trim();
      const stock = Number(stockRaw);
      if (!stockRaw || !Number.isInteger(stock) || stock < 1) {
        errors.stock = t('validation.stockMin');
      }

      if (!values.categoryId) {
        errors.categoryId = t('validation.categoryRequired');
      }

      if (!values.subcategoryId) {
        errors.subcategoryId = t('validation.subcategoryRequired');
      }

      const attributeErrors: Record<string, string> = {};
      for (const definition of attributesRef.current) {
        const value = values.attributes[definition.id];
        if (definition.required && !hasAttributeValue(value ?? '')) {
          attributeErrors[definition.id] = t('validation.attributeRequired');
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
        const created = await createLot.mutateAsync({
          title: values.title.trim(),
          description: values.description.trim() || null,
          price: Number(values.price),
          stock: Number(values.stock),
          categoryId: values.categoryId,
          subcategoryId: values.subcategoryId,
          attributes: buildAttributeInputs(
            attributesRef.current,
            values.attributes,
          ),
          preview: values.preview,
          photos: values.photos,
        });

        toast.success(t('success'));

        if (categorySlugRef.current && subcategorySlugRef.current) {
          router.push(
            `/listings/${categorySlugRef.current}/${subcategorySlugRef.current}/lot/${created.id}`,
          );
        } else {
          router.push('/listings');
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

  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(formik.values.categoryId || null);

  const { data: attributes, isLoading: attributesLoading } =
    useListingFilterAttributes(formik.values.subcategoryId || null);

  const attributeDefinitions = useMemo(
    () => attributes ?? [],
    [attributes],
  );

  const categorySlug =
    categories?.find((item) => item.id === formik.values.categoryId)?.slug ??
    null;
  const subcategorySlug =
    subcategories?.find((item) => item.id === formik.values.subcategoryId)
      ?.slug ?? null;

  useEffect(() => {
    attributesRef.current = attributeDefinitions;
  }, [attributeDefinitions]);

  useEffect(() => {
    categorySlugRef.current = categorySlug;
  }, [categorySlug]);

  useEffect(() => {
    subcategorySlugRef.current = subcategorySlug;
  }, [subcategorySlug]);

  const setFieldValue = formik.setFieldValue;
  const skipCategoryReset = useRef(true);

  useEffect(() => {
    if (!categories || !formik.values.categoryId) {
      return;
    }

    const categoryExists = categories.some(
      (item) => item.id === formik.values.categoryId,
    );
    if (!categoryExists) {
      void setFieldValue('categoryId', '');
      void setFieldValue('subcategoryId', '');
    }
  }, [categories, formik.values.categoryId, setFieldValue]);

  useEffect(() => {
    if (!subcategories || !formik.values.subcategoryId) {
      return;
    }

    const subcategoryExists = subcategories.some(
      (item) => item.id === formik.values.subcategoryId,
    );
    if (!subcategoryExists) {
      void setFieldValue('subcategoryId', '');
    }
  }, [subcategories, formik.values.subcategoryId, setFieldValue]);

  useEffect(() => {
    if (skipCategoryReset.current) {
      skipCategoryReset.current = false;
      return;
    }
    void setFieldValue('subcategoryId', '');
    void setFieldValue('attributes', {});
  }, [formik.values.categoryId, setFieldValue]);

  useEffect(() => {
    if (!formik.values.subcategoryId) {
      void setFieldValue('attributes', {});
      return;
    }

    const nextAttributes: Record<string, LotAttributeInputValue> = {};
    for (const definition of attributeDefinitions) {
      nextAttributes[definition.id] = emptyAttributeValue(definition.type);
    }
    void setFieldValue('attributes', nextAttributes);
  }, [attributeDefinitions, formik.values.subcategoryId, setFieldValue]);

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
      formik.setStatus({ formError: t('validation.photoType') });
    } else if (file.size > LOT_PHOTO_MAX_BYTES) {
      formik.setStatus({ formError: t('validation.photoSize') });
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

    for (const file of incoming) {
      if (next.length >= MAX_LOT_PHOTOS) {
        break;
      }
      if (!acceptedTypes.has(file.type)) {
        formik.setStatus({ formError: t('validation.photoType') });
        continue;
      }
      if (file.size > LOT_PHOTO_MAX_BYTES) {
        formik.setStatus({ formError: t('validation.photoSize') });
        continue;
      }
      next.push(file);
    }

    void setFieldValue('photos', next);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
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

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 py-10">
      <header className="space-y-4">
        <Link
          href="/listings"
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
            {t('sectionBasics')}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="lot-title">{t('fields.title')}</Label>
            <Input
              id="lot-title"
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
            <Label htmlFor="lot-description">{t('fields.description')}</Label>
            <Textarea
              id="lot-description"
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
              <Label htmlFor="lot-price">{t('fields.price')}</Label>
              <Input
                id="lot-price"
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
              <Label htmlFor="lot-stock">{t('fields.stock')}</Label>
              <Input
                id="lot-stock"
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
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
            {t('sectionCategory')}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="lot-category">{t('fields.category')}</Label>
            {categoriesLoading ? (
              <Spinner size="sm" />
            ) : (
              <Select
                id="lot-category"
                name="categoryId"
                value={formik.values.categoryId}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(
                  formik.touched.categoryId && formik.errors.categoryId,
                )}
              >
                <option value="">{t('selectCategory')}</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
            {formik.touched.categoryId && formik.errors.categoryId ? (
              <p className="text-xs text-destructive">
                {formik.errors.categoryId}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot-subcategory">{t('fields.subcategory')}</Label>
            {subcategoriesLoading && formik.values.categoryId ? (
              <Spinner size="sm" />
            ) : (
              <Select
                id="lot-subcategory"
                name="subcategoryId"
                value={formik.values.subcategoryId}
                disabled={!formik.values.categoryId}
                onChange={(event) => {
                  clearFormError();
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
                hasError={Boolean(
                  formik.touched.subcategoryId && formik.errors.subcategoryId,
                )}
              >
                <option value="">{t('selectSubcategory')}</option>
                {(subcategories ?? []).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </Select>
            )}
            {formik.touched.subcategoryId && formik.errors.subcategoryId ? (
              <p className="text-xs text-destructive">
                {formik.errors.subcategoryId}
              </p>
            ) : null}
            {formik.values.categoryId &&
            !subcategoriesLoading &&
            subcategories?.length === 0 ? (
              <p className="text-xs text-subtle">{t('noSubcategories')}</p>
            ) : null}
          </div>
        </section>

        {formik.values.subcategoryId ? (
          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
              {t('sectionAttributes')}
            </h2>
            {attributesLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" />
              </div>
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
                  void formik.setFieldTouched(
                    `attributes.${attributeId}`,
                    true,
                  );
                }}
              />
            )}
          </section>
        ) : null}

        <section className="space-y-4 border-t border-border pt-6">
          <div className="space-y-1">
            <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
              {t('sectionPreview')}
            </h2>
            <p className="text-xs text-subtle">{t('previewHint')}</p>
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
              <PhotoThumb
                file={formik.values.preview}
                onRemove={removePreview}
                removeLabel={t('removePreview')}
                aspectClassName="aspect-[16/10]"
              />
            ) : (
              <button
                type="button"
                onClick={() => previewInputRef.current?.click()}
                className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                <span className="text-xs">{t('addPreview')}</span>
              </button>
            )}
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
              {t('sectionPhotos')}
            </h2>
            <p className="text-xs text-subtle">
              {t('photosHint', { max: MAX_LOT_PHOTOS })}
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
            {formik.values.photos.map((photo, index) => (
              <PhotoThumb
                key={`${photo.name}-${photo.lastModified}-${index}`}
                file={photo}
                onRemove={() => removePhoto(index)}
                removeLabel={t('removePhoto')}
              />
            ))}

            {formik.values.photos.length < MAX_LOT_PHOTOS ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                <span className="text-xs">{t('addPhoto')}</span>
              </button>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" isLoading={formik.isSubmitting}>
            {t('submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PhotoThumb({
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
