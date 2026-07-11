import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { Public } from '../../decorators/public.decorator';
import { CreateLotDto } from './dto/create-lot.dto';
import { FindLotsQueryDto } from './dto/find-lots.query.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { ListingsService } from './listings.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

const photosValidationPipe = new FileValidationPipe({
  maxSizeInBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  optional: true,
  maxFiles: 5,
});

const storageOptions = { storage: memoryStorage() };

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Create a new lot with dynamic attributes and optional proof photos',
    description:
      'Accepts multipart form-data. Field "attributes" must be a JSON string. ' +
      'Optional field "photos" accepts up to 5 images (jpeg, png, webp, max 5MB each).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'price', 'categoryId', 'subcategoryId', 'attributes'],
      properties: {
        title: { type: 'string', example: 'PUBG Diamond Account Level 78' },
        description: {
          type: 'string',
          example: 'XBOX account, Diamond rank, many skins.',
          nullable: true,
        },
        price: { type: 'number', example: 49.99, minimum: 1 },
        stock: {
          type: 'integer',
          example: 1,
          default: 1,
          minimum: 1,
          description: 'Available quantity. Defaults to 1 when omitted.',
        },
        categoryId: { type: 'string', example: 'category-uuid' },
        subcategoryId: { type: 'string', example: 'subcategory-uuid' },
        attributes: {
          type: 'string',
          description: 'JSON array: [{ "attributeId": "...", "value": "..." }]',
          example:
            '[{"attributeId":"attr-uuid","value":"XBOX"},{"attributeId":"attr-uuid","value":"Diamond"}]',
        },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 5,
          description: 'Optional proof images, up to 5 files',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Lot created' })
  @UseInterceptors(FilesInterceptor('photos', 5, storageOptions))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLotDto,
    @UploadedFiles(photosValidationPipe) photos?: Express.Multer.File[],
  ) {
    return this.listingsService.createLot(user.id, dto, photos ?? []);
  }

  @Get(':categorySlug/:subcategorySlug')
  @Public()
  @ApiOperation({
    summary: 'List lots by category and subcategory slugs',
    description:
      'Lots are always scoped to subcategory. Category and subcategory are resolved by slug from the URL. ' +
      'Supports search, attribute filters (by key), sorting, and pagination. ' +
      'Returns only OPEN lots with stock > 0.',
  })
  @ApiParam({ name: 'categorySlug', example: 'pubg' })
  @ApiParam({ name: 'subcategorySlug', example: 'accounts' })
  @ApiResponse({ status: 200, description: 'Paginated lot list' })
  @ApiResponse({
    status: 404,
    description: 'Category or subcategory not found',
  })
  findMany(
    @Param('categorySlug') categorySlug: string,
    @Param('subcategorySlug') subcategorySlug: string,
    @Query() query: FindLotsQueryDto,
  ) {
    return this.listingsService.findLots(categorySlug, subcategorySlug, query);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update an open lot (seller only)',
    description:
      'Full lot update while status is OPEN. Category and subcategory cannot be changed. ' +
      'Accepts multipart form-data. Field "attributes" must be a JSON string. ' +
      'Field "keepImageIds" must be a JSON array of existing image ids to retain (in order). ' +
      'Optional field "photos" accepts new images; total images (kept + new) must not exceed 5.',
  })
  @ApiParam({ name: 'id', description: 'Lot id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'price', 'attributes', 'keepImageIds'],
      properties: {
        title: { type: 'string', example: 'PUBG Diamond Account Level 78' },
        description: {
          type: 'string',
          example: 'XBOX account, Diamond rank, many skins.',
          nullable: true,
        },
        price: { type: 'number', example: 49.99, minimum: 1 },
        stock: {
          type: 'integer',
          example: 1,
          default: 1,
          minimum: 1,
          description: 'Available quantity. Defaults to 1 when omitted.',
        },
        attributes: {
          type: 'string',
          description: 'JSON array: [{ "attributeId": "...", "value": "..." }]',
          example:
            '[{"attributeId":"attr-uuid","value":"XBOX"},{"attributeId":"attr-uuid","value":"Diamond"}]',
        },
        keepImageIds: {
          type: 'string',
          description:
            'JSON array of existing lot image ids to keep, in display order',
          example: '["image-uuid-1","image-uuid-2"]',
        },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 5,
          description: 'Optional new proof images',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Lot updated' })
  @ApiResponse({ status: 403, description: 'Not the lot seller' })
  @ApiResponse({ status: 409, description: 'Lot is not open for editing' })
  @UseInterceptors(FilesInterceptor('photos', 5, storageOptions))
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLotDto,
    @UploadedFiles(photosValidationPipe) photos?: Express.Multer.File[],
  ) {
    return this.listingsService.updateLot(user.id, id, dto, photos ?? []);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get lot by id' })
  @ApiParam({ name: 'id', description: 'Lot id' })
  @ApiResponse({ status: 200, description: 'Lot returned' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }
}
