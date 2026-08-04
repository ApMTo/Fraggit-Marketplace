import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ModerationTargetType, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  FindModerationLotsQueryDto,
  LotModerationReasonDto,
} from './dto/moderation-lots.dto';
import {
  CreateReportDto,
  FindReportsQueryDto,
  ReportConversationQueryDto,
  RequestReportVerdictDto,
  UpdateReportDto,
} from './dto/moderation-reports.dto';
import {
  CreateLotDisputeMessageDto,
  LotDisputeMessagesQueryDto,
} from './dto/moderation-lot-dispute.dto';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  FindAuditQueryDto,
  FindTicketsQueryDto,
  RequestTicketVerdictDto,
  ResolveTicketDto,
  UpdateTicketDto,
} from './dto/moderation-tickets.dto';
import {
  FindModerationUsersQueryDto,
  ModerationReasonDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/moderation-users.dto';
import { ModerationAuditService } from './services/moderation-audit.service';
import { ModerationChatService } from './services/moderation-chat.service';
import { ModerationLotDisputeService } from './services/moderation-lot-dispute.service';
import { ModerationLotsService } from './services/moderation-lots.service';
import { ModerationReportsService } from './services/moderation-reports.service';
import { ModerationReviewsService } from './services/moderation-reviews.service';
import { ModerationTicketsService } from './services/moderation-tickets.service';
import { ModerationUsersService } from './services/moderation-users.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class ModerationController {
  constructor(
    private readonly users: ModerationUsersService,
    private readonly lots: ModerationLotsService,
    private readonly reviews: ModerationReviewsService,
    private readonly reports: ModerationReportsService,
    private readonly tickets: ModerationTicketsService,
    private readonly chat: ModerationChatService,
    private readonly lotDisputes: ModerationLotDisputeService,
    private readonly audit: ModerationAuditService,
  ) {}

  @Get('overview')
  @Roles(UserRole.MODERATOR)
  @ApiOperation({ summary: 'Moderation dashboard counts' })
  async overview(@CurrentUser() actor: AuthUser) {
    const [openReports, openTickets] = await Promise.all([
      this.reports.countOpen(actor.role),
      this.tickets.countOpen(),
    ]);
    return { openReports, openTickets };
  }

  // ── Users ──────────────────────────────────────────────

  @Get('users')
  @Roles(UserRole.MODERATOR)
  findUsers(@Query() query: FindModerationUsersQueryDto) {
    return this.users.findUsers(query);
  }

  @Get('users/:id')
  @Roles(UserRole.MODERATOR)
  findUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findUserDetail(id);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  updateUserStatus(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.users.updateStatus(actor.id, actor.role, id, dto);
  }

  @Post('users/:id/sessions/revoke')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  revokeSessions(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerationReasonDto,
  ) {
    return this.users.revokeSessions(actor.id, actor.role, id, dto.reason);
  }

  @Post('users/:id/security/reset-2fa')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  resetTwoFactor(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerationReasonDto,
  ) {
    return this.users.resetTwoFactor(actor.id, actor.role, id, dto.reason);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiHeader(CSRF_HEADER)
  updateRole(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.users.updateRole(actor.id, actor.role, id, dto);
  }

  // ── Lots ───────────────────────────────────────────────

  @Get('lots')
  @Roles(UserRole.ADMIN)
  findLots(@Query() query: FindModerationLotsQueryDto) {
    return this.lots.findLots(query);
  }

  @Post('lots/:id/remove')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  removeLot(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LotModerationReasonDto,
  ) {
    return this.lots.remove(actor.id, id, dto.reason);
  }

  @Post('lots/:id/restore')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  restoreLot(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LotModerationReasonDto,
  ) {
    return this.lots.restore(actor.id, id, dto.reason);
  }

  @Post('lots/:id/under-review')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  underReviewLot(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LotModerationReasonDto,
  ) {
    return this.lots.underReview(actor.id, id, dto.reason);
  }

  // ── Reviews ────────────────────────────────────────────

  @Post('reviews/:id/hide')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  hideReview(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerationReasonDto,
  ) {
    return this.reviews.hide(actor.id, id, dto.reason);
  }

  @Post('reviews/:id/unhide')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  unhideReview(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerationReasonDto,
  ) {
    return this.reviews.unhide(actor.id, id, dto.reason);
  }

  // ── Reports ────────────────────────────────────────────

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Create a report (any authenticated user)' })
  createReport(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.reports.create(user.id, dto);
  }

  @Get('reports/mine')
  @ApiOperation({ summary: 'List reports created by the current user' })
  findMyReports(
    @CurrentUser() user: AuthUser,
    @Query() query: FindReportsQueryDto,
  ) {
    return this.reports.findMyReports(user.id, query);
  }

  @Get('reports')
  @Roles(UserRole.MODERATOR)
  @ApiOperation({
    summary: 'List reports. LOT and MESSAGE queues require ADMIN+',
  })
  findReports(
    @CurrentUser() actor: AuthUser,
    @Query() query: FindReportsQueryDto,
  ) {
    return this.reports.findReports(query, actor.role);
  }

  @Get('reports/:id/conversation')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Read private buyer–seller chat for a LOT report or message window for MESSAGE reports. Audited as CHAT_VIEW',
  })
  findReportedConversation(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportConversationQueryDto,
  ) {
    return this.chat.findReportedConversation(actor.id, id, query.context);
  }

  @Get('reports/:id/user-conversations')
  @Roles(UserRole.MODERATOR)
  @ApiOperation({
    summary:
      'List DM threads for reported user (USER reports). Reading a thread is audited separately.',
  })
  listUserReportConversations(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chat.listUserReportConversations(actor.id, actor.role, id);
  }

  @Get('reports/:id/user-conversations/:conversationId')
  @Roles(UserRole.MODERATOR)
  @ApiOperation({
    summary: 'Read a DM thread for a USER report (audited CHAT_VIEW)',
  })
  findUserReportConversation(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: ReportConversationQueryDto,
  ) {
    return this.chat.findUserReportConversation(
      actor.id,
      actor.role,
      id,
      conversationId,
      query.context,
    );
  }

  @Post('reports/:id/request-verdict')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary:
      'Assignee moderator sends USER report to admins (AWAITING_VERDICT)',
  })
  requestReportVerdict(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestReportVerdictDto,
  ) {
    return this.reports.requestAdminVerdict(
      actor.id,
      actor.role,
      id,
      dto.summary,
    );
  }

  @Patch('reports/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  updateReport(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reports.update(actor.id, actor.role, id, dto);
  }

  @Get('lot-disputes/order/:orderId')
  @ApiOperation({
    summary: 'Mediation room for an order dispute (buyer, seller, staff)',
  })
  findOrderDisputeRoom(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.lotDisputes.findRoomForOrder(orderId, user.id, user.role);
  }

  @Get('lot-disputes/:roomId')
  @ApiOperation({ summary: 'Mediation room with messages' })
  findLotDisputeRoom(
    @CurrentUser() user: AuthUser,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query() query: LotDisputeMessagesQueryDto,
  ) {
    return this.lotDisputes.findRoom(roomId, user.id, user.role, query.limit);
  }

  @Post('lot-disputes/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Post text or image in lot mediation room' })
  addLotDisputeMessage(
    @CurrentUser() user: AuthUser,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateLotDisputeMessageDto,
  ) {
    return this.lotDisputes.addMessage(roomId, user.id, user.role, dto);
  }

  // ── Tickets ────────────────────────────────────────────

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Open support/dispute ticket' })
  createTicket(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.tickets.create(user.id, dto);
  }

  @Get('tickets')
  @Roles(UserRole.MODERATOR)
  findTickets(@Query() query: FindTicketsQueryDto) {
    return this.tickets.findTickets(query);
  }

  @Get('tickets/:id')
  findTicket(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tickets.findById(id, user.id, user.role);
  }

  @Post('tickets/:id/claim')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Assign the ticket to yourself and start work' })
  claimTicket(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tickets.claim(actor.id, id);
  }

  @Get('tickets/:id/lot-dispute')
  @Roles(UserRole.MODERATOR)
  @ApiOperation({ summary: 'Mediation room for an order dispute ticket' })
  findTicketLotDispute(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LotDisputeMessagesQueryDto,
  ) {
    return this.lotDisputes.findRoomByTicket(
      id,
      actor.id,
      actor.role,
      query.limit,
    );
  }

  @Get('tickets/:id/conversation')
  @Roles(UserRole.MODERATOR)
  @ApiOperation({
    summary:
      'Read buyer–seller private chat for an order dispute ticket (assignee mod or ADMIN+). Audited as CHAT_VIEW',
  })
  findTicketPartiesConversation(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportConversationQueryDto,
  ) {
    return this.chat.findTicketPartiesConversation(
      actor.id,
      actor.role,
      id,
      query.context,
    );
  }

  @Patch('tickets/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  updateTicket(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.tickets.update(actor.id, id, dto);
  }

  @Post('tickets/:id/request-verdict')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR)
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary:
      'Assignee moderator requests admin verdict (status AWAITING_VERDICT, notifies admins)',
  })
  requestTicketVerdict(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestTicketVerdictDto,
  ) {
    return this.tickets.requestAdminVerdict(actor.id, actor.role, id, dto);
  }

  @Post('tickets/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiHeader(CSRF_HEADER)
  resolveTicket(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveTicketDto,
  ) {
    return this.tickets.resolve(actor.id, id, dto);
  }

  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CSRF_HEADER)
  addTicketMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTicketMessageDto,
  ) {
    return this.tickets.addMessage(user.id, user.role, id, dto);
  }

  // ── Audit ──────────────────────────────────────────────

  @Get('audit')
  @Roles(UserRole.MODERATOR)
  findAudit(@Query() query: FindAuditQueryDto) {
    const targetType =
      query.targetType &&
      Object.values(ModerationTargetType).includes(
        query.targetType as ModerationTargetType,
      )
        ? (query.targetType as ModerationTargetType)
        : undefined;

    return this.audit.list({
      targetType,
      targetId: query.targetId,
      actorId: query.actorId,
      page: query.page,
      limit: query.limit,
    });
  }
}
