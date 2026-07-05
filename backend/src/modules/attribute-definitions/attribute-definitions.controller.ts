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
import { StrictRoles } from '../auth/decorators/roles.decorator';
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

  @Get('subcategories/:subcategoryId/attribute-definitions')
  @Public()
  @ApiOperation({ summary: 'List attribute definitions for a subcategory' })
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

  @Post('subcategories/:subcategoryId/attribute-definitions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Create attribute definition (admin only)' })
  @ApiParam({ name: 'subcategoryId', description: 'Subcategory id' })
  create(
    @Param('subcategoryId') subcategoryId: string,
    @Body() dto: CreateAttributeDefinitionDto,
  ) {
    return this.attributeDefinitionsService.create(subcategoryId, dto);
  }

  @Patch('attribute-definitions/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Update attribute definition (admin only)' })
  @ApiParam({ name: 'id', description: 'Attribute definition id' })
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDefinitionDto) {
    return this.attributeDefinitionsService.update(id, dto);
  }

  @Delete('attribute-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Delete attribute definition (admin only)' })
  @ApiParam({ name: 'id', description: 'Attribute definition id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.attributeDefinitionsService.remove(id);
  }
}
