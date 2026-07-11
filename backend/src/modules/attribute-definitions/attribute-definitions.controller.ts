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
import { AttributeDefinitionsService } from './attribute-definitions.service';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Attribute Definitions')
@Controller()
export class AttributeDefinitionsController {
  constructor(
    private readonly attributeDefinitionsService: AttributeDefinitionsService,
  ) {}

  @Get('categories/:categoryId/attribute-definitions')
  @Public()
  @ApiOperation({
    summary: 'List global attribute definitions for a category',
    description:
      'Returns attributes with isGlobal=true that apply to all subcategories of the category.',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  findGlobalByCategory(@Param('categoryId') categoryId: string) {
    return this.attributeDefinitionsService.findGlobalByCategoryId(categoryId);
  }

  @Get('subcategories/:subcategoryId/attribute-definitions')
  @Public()
  @ApiOperation({
    summary: 'List attribute definitions for a subcategory',
    description:
      'Returns global category attributes plus subcategory-specific attributes.',
  })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory id' })
  @ApiResponse({ status: 200, description: 'Attribute definitions returned' })
  findBySubcategory(@Param('subcategoryId') subcategoryId: string) {
    return this.attributeDefinitionsService.findBySubcategoryId(subcategoryId);
  }

  @Get('attribute-definitions/:id')
  @Public()
  @ApiOperation({ summary: 'Get attribute definition by id' })
  @ApiParam({ name: 'id', description: 'Attribute definition id' })
  findOne(@Param('id') id: string) {
    return this.attributeDefinitionsService.findById(id);
  }

  @Post('categories/:categoryId/attribute-definitions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary:
      'Create global attribute definition for a category (admin and above)',
    description:
      'Global attributes apply to all subcategories (e.g. Platform for Accounts and Activation).',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  createGlobal(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateAttributeDefinitionDto,
  ) {
    return this.attributeDefinitionsService.createForCategory(categoryId, dto);
  }

  @Post('subcategories/:subcategoryId/attribute-definitions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary:
      'Create subcategory-specific attribute definition (admin and above)',
  })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory id' })
  createForSubcategory(
    @Param('subcategoryId') subcategoryId: string,
    @Body() dto: CreateAttributeDefinitionDto,
  ) {
    return this.attributeDefinitionsService.createForSubcategory(
      subcategoryId,
      dto,
    );
  }

  @Patch('attribute-definitions/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Update attribute definition (admin and above)' })
  @ApiParam({ name: 'id', description: 'Attribute definition id' })
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDefinitionDto) {
    return this.attributeDefinitionsService.update(id, dto);
  }

  @Delete('attribute-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Delete attribute definition (admin and above)' })
  @ApiParam({ name: 'id', description: 'Attribute definition id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.attributeDefinitionsService.remove(id);
  }
}
