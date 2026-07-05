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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoriesService } from './subcategories.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Subcategories')
@Controller()
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Get('categories/:categoryId/subcategories')
  @Public()
  @ApiOperation({ summary: 'List subcategories for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  @ApiResponse({ status: 200, description: 'Subcategories returned' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.subcategoriesService.findByCategoryId(categoryId);
  }

  @Get('subcategories/:id')
  @Public()
  @ApiOperation({ summary: 'Get subcategory by id' })
  @ApiParam({ name: 'id', description: 'Subcategory id' })
  findOne(@Param('id') id: string) {
    return this.subcategoriesService.findById(id);
  }

  @Post('categories/:categoryId/subcategories')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Create subcategory (admin and above)',
    description:
      'Pass globalAttributeIds to include selected global category attributes in this subcategory.',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  create(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.subcategoriesService.create(categoryId, dto);
  }

  @Patch('subcategories/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Update subcategory (admin and above)' })
  @ApiParam({ name: 'id', description: 'Subcategory id' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.subcategoriesService.update(id, dto);
  }

  @Delete('subcategories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Delete subcategory (admin and above)' })
  @ApiParam({ name: 'id', description: 'Subcategory id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.subcategoriesService.remove(id);
  }
}
