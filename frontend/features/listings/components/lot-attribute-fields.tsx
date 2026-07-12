'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AttributeDefinitionPublic } from '@/types/category';
import type { LotAttributeInputValue } from '@/types/lot';

type LotAttributeFieldsProps = {
  attributes: AttributeDefinitionPublic[];
  values: Record<string, LotAttributeInputValue>;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onChange: (attributeId: string, value: LotAttributeInputValue) => void;
  onBlur: (attributeId: string) => void;
};

export function LotAttributeFields({
  attributes,
  values,
  errors = {},
  touched = {},
  onChange,
  onBlur,
}: LotAttributeFieldsProps) {
  const t = useTranslations('listings.create');

  if (attributes.length === 0) {
    return (
      <p className="text-sm text-subtle">{t('noAttributes')}</p>
    );
  }

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => {
        const value = values[attribute.id];
        const error = touched[attribute.id] ? errors[attribute.id] : undefined;

        return (
          <AttributeField
            key={attribute.id}
            attribute={attribute}
            value={value}
            error={error}
            onChange={(next) => onChange(attribute.id, next)}
            onBlur={() => onBlur(attribute.id)}
          />
        );
      })}
    </div>
  );
}

type AttributeFieldProps = {
  attribute: AttributeDefinitionPublic;
  value: LotAttributeInputValue | undefined;
  error?: string;
  onChange: (value: LotAttributeInputValue) => void;
  onBlur: () => void;
};

function AttributeField({
  attribute,
  value,
  error,
  onChange,
  onBlur,
}: AttributeFieldProps) {
  const t = useTranslations('listings.create');
  const label = (
    <>
      {attribute.label}
      {attribute.required ? (
        <span className="text-destructive"> *</span>
      ) : null}
    </>
  );

  switch (attribute.type) {
    case 'TEXTAREA':
      return (
        <FieldShell label={label} error={error}>
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            aria-invalid={Boolean(error)}
            rows={4}
          />
        </FieldShell>
      );

    case 'NUMBER':
      return (
        <FieldShell label={label} error={error}>
          <Input
            type="number"
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            hasError={Boolean(error)}
          />
        </FieldShell>
      );

    case 'BOOLEAN':
      return (
        <FieldShell label={label} error={error}>
          <div className="flex items-center gap-3">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <span className="text-sm text-muted">
              {value ? t('yes') : t('no')}
            </span>
          </div>
        </FieldShell>
      );

    case 'SELECT':
      return (
        <FieldShell label={label} error={error}>
          <Select
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            hasError={Boolean(error)}
          >
            <option value="">{t('selectPlaceholder')}</option>
            {(attribute.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FieldShell>
      );

    case 'MULTISELECT': {
      const selected = Array.isArray(value) ? value : [];

      return (
        <FieldShell label={label} error={error}>
          <ul className="space-y-2">
            {(attribute.options ?? []).map((option) => {
              const checked = selected.includes(option);

              return (
                <li key={option}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={checked}
                      onChange={() => {
                        onChange(
                          checked
                            ? selected.filter((item) => item !== option)
                            : [...selected, option],
                        );
                      }}
                      onBlur={onBlur}
                    />
                    {option}
                  </label>
                </li>
              );
            })}
          </ul>
        </FieldShell>
      );
    }

    case 'TEXT':
    default:
      return (
        <FieldShell label={label} error={error}>
          <Input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            hasError={Boolean(error)}
            className={cn(error && 'border-destructive')}
          />
        </FieldShell>
      );
  }
}

function FieldShell({
  label,
  error,
  children,
}: {
  label: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="normal-case tracking-normal">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
