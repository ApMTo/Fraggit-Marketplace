import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
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
import { Public } from '../../decorators/public.decorator';
import { CreateLotDto } from './dto/create-lot.dto';
import { ListingsService } from './listings.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Create a new lot with dynamic attributes' })
  @ApiResponse({ status: 201, description: 'Lot created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLotDto) {
    return this.listingsService.createLot(user.id, dto);
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
