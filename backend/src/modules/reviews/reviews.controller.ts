import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Public } from '../../decorators/public.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews.query.dto';
import { ReviewsService } from './reviews.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Leave a review for an approved order (buyer only)',
    description:
      'One review per order. Updates the seller average rating (1-5 stars).',
  })
  @ApiResponse({ status: 201, description: 'Review created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List reviews for a seller' })
  @ApiResponse({ status: 200, description: 'Paginated review list' })
  findMany(@Query() query: FindReviewsQueryDto) {
    return this.reviewsService.findReviews(query);
  }

  @Get('order/:orderId')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Get review for an order (buyer or seller only)',
  })
  @ApiParam({ name: 'orderId', description: 'Order id' })
  @ApiResponse({ status: 200, description: 'Review returned or null' })
  findByOrder(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.reviewsService.findByOrderId(user.id, orderId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get review by id' })
  @ApiParam({ name: 'id', description: 'Review id' })
  @ApiResponse({ status: 200, description: 'Review returned' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findById(id);
  }
}
