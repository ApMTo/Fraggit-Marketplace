import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { CHAT_MAX_TEXT_LENGTH } from '../constants/chat.constants';

export class FindConversationsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by username or display name of the other participant',
    example: 'seller123',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.search_min_length' })
  @MaxLength(100, { message: 'validation.search_max_length' })
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.page_must_be_integer' })
  @Min(1, { message: 'validation.page_min_value' })
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.limit_must_be_integer' })
  @Min(1, { message: 'validation.limit_min_value' })
  @Max(50, { message: 'validation.limit_max_value' })
  limit = 20;
}

export class FindMessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Return messages older than this message id (cursor pagination)',
  })
  @IsOptional()
  @IsUUID('4', { message: V.invalidUuid })
  beforeMessageId?: string;

  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.limit_must_be_integer' })
  @Min(1, { message: 'validation.limit_min_value' })
  @Max(100, { message: 'validation.limit_max_value' })
  limit = 30;
}

export class StartConversationDto {
  @ApiProperty({ description: 'User id to start or open a direct chat with' })
  @IsUUID('4', { message: V.invalidUuid })
  participantUserId!: string;
}

export class SendTextMessageDto {
  @ApiProperty({ maxLength: CHAT_MAX_TEXT_LENGTH })
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.message_required' })
  @MaxLength(CHAT_MAX_TEXT_LENGTH, { message: 'validation.message_too_long' })
  content!: string;
}

export class SendImageMessageDto {
  @ApiProperty({ description: 'Public URL of the uploaded image' })
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.url_required' })
  @MaxLength(2048, { message: 'validation.url_too_long' })
  url!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: 'validation.mime_type_required' })
  @MaxLength(100, { message: 'validation.mime_type_too_long' })
  mimeType!: string;

  @ApiProperty({ example: 102400 })
  @Type(() => Number)
  @IsInt({ message: 'validation.file_size_must_be_integer' })
  @Min(1, { message: 'validation.file_size_min_value' })
  @Max(5_242_880, { message: 'validation.file_size_max_value' })
  size!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.width_must_be_integer' })
  @Min(1, { message: 'validation.width_min_value' })
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.height_must_be_integer' })
  @Min(1, { message: 'validation.height_min_value' })
  height?: number;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Id of the last message the user has read' })
  @IsUUID('4', { message: V.invalidUuid })
  lastReadMessageId!: string;
}

export class WsSendTextMessageDto {
  @IsUUID('4', { message: V.invalidUuid })
  conversationId!: string;

  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.message_required' })
  @MaxLength(CHAT_MAX_TEXT_LENGTH, { message: 'validation.message_too_long' })
  content!: string;
}

export class WsMarkReadDto {
  @IsUUID('4', { message: V.invalidUuid })
  conversationId!: string;

  @IsUUID('4', { message: V.invalidUuid })
  lastReadMessageId!: string;
}
