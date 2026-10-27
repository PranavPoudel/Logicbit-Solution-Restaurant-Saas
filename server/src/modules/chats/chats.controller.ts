// chats.controller.ts
//
// Visitor / widget (no login needed; guests have no JWT, so the unguessable
// session id acts as the access token):
//   POST /api/v1/chats                 start a chat on a restaurant (guest or logged-in customer)
//   POST /api/v1/chats/general         platform-wide assistant, nothing saved
//   POST /api/v1/chats/:id/messages    visitor message -> bot reply (or "a human has taken over")
//   GET  /api/v1/chats/:id/messages    polling: thread + takenOver/ended
//   POST /api/v1/chats/:id/end         visitor ends the chat
//
// Restaurant owner (JwtAuthGuard, own tenant only):
//   GET  /api/v1/chats/received
//   POST /api/v1/chats/:id/reply
//   POST /api/v1/chats/:id/close
//
// Platform staff (PlatformStaffJwtAuthGuard), same convention as the other
// /platform-admin/* routes:
//   GET  /api/v1/platform-admin/chats
//   POST /api/v1/platform-admin/chats/:id/reply
//   POST /api/v1/platform-admin/chats/:id/close
//
// Public routes are rate limited per IP and per route (over the limit -> 429).
// Static paths (general, received) are declared before the ':id' routes.
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { ChatBotService } from './chat-bot.service';
import { ChatsService } from './chats.service';
import { GeneralChatDto } from './dto/general-chat.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { StartChatDto } from './dto/start-chat.dto';
import { OptionalCustomerJwtGuard } from './guards/optional-customer-jwt.guard';

const PER_MINUTE = 60_000;

@ApiTags('Chats')
@Controller('api/v1')
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly bot: ChatBotService,
  ) {}

  // ---- visitor / widget -----------------------------------------------------

  @Post('chats')
  @UseGuards(OptionalCustomerJwtGuard)
  @Throttle({ default: { limit: 10, ttl: PER_MINUTE } })
  @ApiOperation({ summary: 'Start a chat on a restaurant (guest or logged-in customer)' })
  start(@Req() req, @Body() dto: StartChatDto) {
    return this.chats.start(req.user?.id, dto);
  }

  // `reply` is null when AI is off or failed, so the widget uses its canned answers.
  @Post('chats/general')
  @Throttle({ default: { limit: 15, ttl: PER_MINUTE } })
  @ApiOperation({ summary: 'Platform-wide assistant (stateless, nothing is stored)' })
  async general(@Body() dto: GeneralChatDto) {
    const reply = await this.bot.generalReply(dto.message, dto.history, dto.latitude, dto.longitude);
    return { reply };
  }

  // Owner inbox. Declared before the ':id' routes.
  @Get('chats/received')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Owner: chats on restaurants in my tenant' })
  received(@Req() req) {
    return this.chats.findForOwner(req.user.tenantId);
  }

  @Post('chats/:id/messages')
  @Throttle({ default: { limit: 30, ttl: PER_MINUTE } })
  @ApiOperation({ summary: 'Visitor sends a message and gets the bot reply' })
  sendMessage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SendChatMessageDto) {
    return this.chats.sendMessage(id, dto);
  }

  @Get('chats/:id/messages')
  @Throttle({ default: { limit: 120, ttl: PER_MINUTE } })
  @ApiOperation({ summary: 'Visitor polling: full thread + takenOver/ended' })
  getMessages(@Param('id', ParseUUIDPipe) id: string) {
    return this.chats.getMessages(id);
  }

  @Post('chats/:id/end')
  @Throttle({ default: { limit: 10, ttl: PER_MINUTE } })
  @ApiOperation({ summary: 'Visitor ends the chat' })
  end(@Param('id', ParseUUIDPipe) id: string) {
    return this.chats.end(id);
  }

  // ---- restaurant owner -----------------------------------------------------

  @Post('chats/:id/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Owner replies in a chat (bot goes quiet)' })
  reply(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SendChatMessageDto) {
    return this.chats.reply(id, { kind: 'owner', tenantId: req.user.tenantId }, dto);
  }

  @Post('chats/:id/close')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Owner ends a chat' })
  close(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.chats.close(id, { kind: 'owner', tenantId: req.user.tenantId });
  }
}

@ApiTags('Chats - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard)
@Controller('api/v1/platform-admin/chats')
export class PlatformChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'Platform staff: every chat on every restaurant' })
  findAll() {
    return this.chats.findAllForAdmin();
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Platform staff replies in a chat (labelled "admin")' })
  reply(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SendChatMessageDto) {
    return this.chats.reply(id, { kind: 'admin' }, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Platform staff ends a chat' })
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.chats.close(id, { kind: 'admin' });
  }
}
