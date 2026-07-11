import { BadRequestException } from '@nestjs/common';
import { AttributeType } from '@prisma/client';
import { AttributeDefinitionForValidation } from '../../attribute-definitions/constants/attribute-definition.select';
import { normalizeLotAttributes } from './normalize-lot-attributes';

const baseDefinition = (
  overrides: Partial<AttributeDefinitionForValidation>,
): AttributeDefinitionForValidation => ({
  id: 'attr-1',
  key: 'platform',
  type: AttributeType.SELECT,
  required: true,
  options: ['PC', 'XBOX'],
  ...overrides,
});

describe('normalizeLotAttributes', () => {
  it('normalizes valid attribute inputs', () => {
    const definitions = [baseDefinition({})];

    expect(
      normalizeLotAttributes(
        [{ attributeId: 'attr-1', value: 'PC' }],
        definitions,
      ),
    ).toEqual([{ attributeId: 'attr-1', value: 'PC' }]);
  });

  it('throws on duplicate attribute ids', () => {
    expect(() =>
      normalizeLotAttributes(
        [
          { attributeId: 'attr-1', value: 'PC' },
          { attributeId: 'attr-1', value: 'XBOX' },
        ],
        [baseDefinition({})],
      ),
    ).toThrow('duplicate_attribute_id');
  });

  it('throws on unknown attribute id', () => {
    expect(() =>
      normalizeLotAttributes(
        [{ attributeId: 'unknown', value: 'PC' }],
        [baseDefinition({})],
      ),
    ).toThrow('unknown_attribute_id');
  });

  it('throws when required attribute is missing', () => {
    expect(() => normalizeLotAttributes([], [baseDefinition({ required: true })])).toThrow(
      'attribute_required:platform',
    );
  });

  it('normalizes boolean and number values', () => {
    const definitions = [
      baseDefinition({
        id: 'bool-1',
        key: 'online',
        type: AttributeType.BOOLEAN,
        required: false,
        options: null,
      }),
      baseDefinition({
        id: 'num-1',
        key: 'level',
        type: AttributeType.NUMBER,
        required: false,
        options: null,
      }),
    ];

    expect(
      normalizeLotAttributes(
        [
          { attributeId: 'bool-1', value: true },
          { attributeId: 'num-1', value: '42' },
        ],
        definitions,
      ),
    ).toEqual([
      { attributeId: 'bool-1', value: 'true' },
      { attributeId: 'num-1', value: '42' },
    ]);
  });

  it('throws for invalid select option', () => {
    expect(() =>
      normalizeLotAttributes(
        [{ attributeId: 'attr-1', value: 'PLAYSTATION' }],
        [baseDefinition({})],
      ),
    ).toThrow(BadRequestException);
  });
});
