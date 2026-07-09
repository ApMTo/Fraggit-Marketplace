import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
import { UserRole } from '@prisma/client';
import { Public } from '../../decorators/public.decorator';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

const categoryImageValidationPipe = new FileValidationPipe({
  maxSizeInBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  optional: true,
});

const storageOptions = { storage: memoryStorage() };

const categoryImageFields = FileFieldsInterceptor(
  [
    { name: 'icon', maxCount: 1 },
    { name: 'preview', maxCount: 1 },
  ],
  storageOptions,
);

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all marketplace categories' })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by id' })
  @ApiParam({ name: 'id', description: 'Category id' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'PUBG' },
        slug: { type: 'string', example: 'pubg' },
        icon: {
          type: 'string',
          format: 'binary',
          description: 'Category icon image',
        },
        preview: {
          type: 'string',
          format: 'binary',
          description: 'Category preview image',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Create category (admin and above)' })
  @UseInterceptors(categoryImageFields)
  create(
    @Body() dto: CreateCategoryDto,
    @UploadedFiles(categoryImageValidationPipe)
    files?: { icon?: Express.Multer.File[]; preview?: Express.Multer.File[] },
  ) {
    return this.categoriesService.create(
      dto,
      files?.icon?.[0],
      files?.preview?.[0],
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'PUBG Mobile' },
        slug: { type: 'string', example: 'pubg-mobile' },
        icon: {
          type: 'string',
          format: 'binary',
          description: 'Category icon image',
        },
        preview: {
          type: 'string',
          format: 'binary',
          description: 'Category preview image',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Update category (admin and above)' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @UseInterceptors(categoryImageFields)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFiles(categoryImageValidationPipe)
    files?: { icon?: Express.Multer.File[]; preview?: Express.Multer.File[] },
  ) {
    return this.categoriesService.update(
      id,
      dto,
      files?.icon?.[0],
      files?.preview?.[0],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Delete category (admin and above)' })
  @ApiParam({ name: 'id', description: 'Category id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
