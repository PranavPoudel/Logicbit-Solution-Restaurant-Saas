import { Module } from '@nestjs/common';
import { AiReplyService } from './ai-reply.service';
import { ChatBotService } from './chat-bot.service';
import { ChatsController, PlatformChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { OptionalCustomerJwtGuard } from './guards/optional-customer-jwt.guard';

// PrismaModule and ConfigModule are global, so they need no import here. The
// 'customer-jwt', 'jwt' and 'platform-staff-jwt' strategies are registered by
// their own modules (CustomerAuthModule, AuthModule, PlatformAuthModule).
@Module({
  controllers: [ChatsController, PlatformChatsController],
  providers: [ChatsService, ChatBotService, AiReplyService, OptionalCustomerJwtGuard],
})
export class ChatsModule {}
