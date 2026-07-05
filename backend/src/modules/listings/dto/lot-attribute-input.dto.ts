import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class LotAttributeInputDto {
  @ApiProperty({ example: 'clxyz123attributeid' })
  @IsString({ message: V.mustBeString })
  attributeId!: string;

  @ApiProperty({
    description:
      'Attribute value. Type depends on attribute definition: string, number, boolean, or string[] for multiselect.',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  @IsDefined({ message: 'validation.attribute_value_required' })
  value!: string | number | boolean | string[];
}
