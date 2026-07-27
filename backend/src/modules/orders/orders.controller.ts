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
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders.query.dto';
import { SubmitCredentialsDto } from './dto/submit-credentials.dto';
import { OrdersService } from './orders.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Purchase a lot (MVP: payment succeeds immediately)',
  })
  @ApiResponse({ status: 201, description: 'Order created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, user.role, dto);
  }

  @Get()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'List orders for the current user' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  findMany(@CurrentUser() user: AuthUser, @Query() query: FindOrdersQueryDto) {
    return this.ordersService.findOrders(user.id, query);
  }

  @Get(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get order by id (buyer or seller only)' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Order returned' })
  @ApiResponse({ status: 403, description: 'Not a participant of this order' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findById(user.id, id);
  }

  @Patch(':id/credentials')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Submit delivery credentials (seller only, ACCOUNT lots)',
    description:
      'Moves order from PENDING to AWAITING_BUYER_CONFIRMATION and starts a 3-day auto-approval timer.',
  })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Credentials submitted' })
  submitCredentials(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SubmitCredentialsDto,
  ) {
    return this.ordersService.submitCredentials(user.id, id, dto);
  }

  @Patch(':id/complete-service')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Mark service as completed (seller only, SERVICE lots)',
    description:
      'Moves order from PENDING to AWAITING_BUYER_CONFIRMATION and starts a 3-day auto-approval timer.',
  })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Service marked as completed' })
  completeService(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.completeService(user.id, id);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Confirm receipt (buyer only)',
    description:
      'Approves the order immediately and cancels the auto-approval timer.',
  })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Order approved' })
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.confirmByBuyer(user.id, id);
  }
}
