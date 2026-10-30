// chats.service.ts — chat sessions between a visitor and a restaurant.
//
// Visitor side (no login needed, the unguessable session id is the access
// token): start, send a message, poll messages, end.
// Owner / platform-staff side: list chats, reply, close.
//
// Who sent a message ("user" | "bot" | "owner" | "admin") is always decided
// here from who is calling, never from the request body.
//
// The auto-reply logic lives in ChatBotService. Once an owner/admin replies,
// the session is "taken over" and the bot stays quiet.
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatBotService } from './chat-bot.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

// Who is replying from the dashboard / admin panel. Built by the controller
// from the verified JWT (tenantId comes from the token, never the body).
export type ChatActor = { kind: 'owner'; tenantId: string } | { kind: 'admin' };

// Stops one session from growing without limit (cost + DB size).
const MAX_MESSAGES_PER_SESSION = 300;
const HISTORY_FOR_BOT = 8;
const OWNER_LIST_LIMIT = 100;
const ADMIN_LIST_LIMIT = 200;

export interface MessageRow {
  id: string;
  from: string;
  text: string;
  createdAt: Date;
}

const messageSelect = { id: true, from: true, text: true, createdAt: true } as const;

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bot: ChatBotService,
  ) {}

  // ===========================================================================
  // Visitor side
  // ===========================================================================

  // `customerId` is whatever the optional guard produced. Owner/staff tokens
  // also pass that guard (shared JWT secret), so it is verified against the
  // Customer table; if it isn't a real customer the visitor is treated as a guest.
  async start(customerId: string | undefined, dto: StartChatDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
      select: { id: true, tenantId: true, isActive: true },
    });
    // Same rule as the public storefront: inactive restaurants can't be chatted with.
    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurant not found');
    }

    const customer = customerId
      ? await this.prisma.customer.findUnique({
          where: { id: customerId },
          select: { id: true, name: true, isActive: true },
        })
      : null;
    const realCustomer = customer && customer.isActive ? customer : null;

    const visitorName = dto.visitorName?.trim() || realCustomer?.name || null;

    // No greeting is stored: the widget shows its own (translated) greeting.
    const session = await this.prisma.chatSession.create({
      data: {
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        customerId: realCustomer?.id ?? null,
        visitorName,
      },
      select: { id: true },
    });
    return { id: session.id };
  }

  async sendMessage(sessionId: string, dto: SendChatMessageDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        restaurantId: true,
        takenOver: true,
        endedAt: true,
        restaurant: { select: { isActive: true } },
        _count: { select: { messages: true } },
        // Last few messages only: enough context for the AI fallback without
        // letting prompt size (and cost) grow with the whole thread.
        messages: { orderBy: { createdAt: 'desc' }, take: HISTORY_FOR_BOT, select: messageSelect },
      },
    });
    if (!session || !session.restaurant.isActive) {
      throw new NotFoundException('Chat session not found');
    }
    if (session.endedAt) throw new BadRequestException('This chat has ended');
    if (session._count.messages >= MAX_MESSAGES_PER_SESSION) {
      throw new BadRequestException('This chat is full. Please start a new chat.');
    }

    const text = dto.text?.trim();
    if (!text) throw new BadRequestException('Message cannot be empty');

    await this.prisma.$transaction([
      this.prisma.chatMessage.create({ data: { sessionId, from: 'user', text } }),
      this.prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } }),
    ]);

    // A human has joined: keep the visitor's message, but the bot stays quiet.
    if (session.takenOver) return { takenOver: true, reply: null };

    const recent: MessageRow[] = session.messages;
    const history = [...recent].reverse().map((m) => ({ from: m.from, text: m.text }));

    let replyText: string;
    try {
      replyText = await this.bot.reply(session.restaurantId, text, history);
    } catch (err) {
      // A bot failure must not break the chat: return no reply and the widget
      // falls back to its built-in canned answers.
      this.logger.error(`Bot reply failed: ${(err as Error)?.message ?? err}`);
      return { takenOver: false, reply: null };
    }

    // The bot can take a few seconds (AI). If a human replied or the chat
    // ended in the meantime, don't talk over them.
    const fresh = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { takenOver: true, endedAt: true },
    });
    if (!fresh || fresh.endedAt) return { takenOver: !!fresh?.takenOver, reply: null };
    if (fresh.takenOver) return { takenOver: true, reply: null };

    const [botMessage] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { sessionId, from: 'bot', text: replyText },
        select: { id: true, text: true },
      }),
      this.prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } }),
    ]);
    return { takenOver: false, reply: { id: botMessage.id, text: botMessage.text } };
  }

  // Visitor polling (every few seconds from the widget) so owner/admin
  // replies appear without a refresh.
  async getMessages(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        takenOver: true,
        endedAt: true,
        restaurant: { select: { isActive: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: MAX_MESSAGES_PER_SESSION, select: messageSelect },
      },
    });
    if (!session || !session.restaurant.isActive) {
      throw new NotFoundException('Chat session not found');
    }
    return {
      takenOver: session.takenOver,
      ended: !!session.endedAt,
      messages: session.messages as MessageRow[],
    };
  }

  // Visitor ends their chat. Idempotent.
  async end(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { endedAt: true },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    if (!session.endedAt) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });
    }
    return { ended: true };
  }

  // ===========================================================================
  // Owner / platform-staff side
  // ===========================================================================

  private readonly inboxSelect = {
    id: true,
    visitorName: true,
    takenOver: true,
    endedAt: true,
    createdAt: true,
    updatedAt: true,
    restaurant: { select: { id: true, name: true, slug: true } },
    customer: { select: { id: true, name: true, email: true } },
    messages: { orderBy: { createdAt: 'asc' as const }, select: messageSelect },
  };

  // Only chats of restaurants in the owner's own tenant.
  findForOwner(tenantId: string) {
    return this.prisma.chatSession.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: OWNER_LIST_LIMIT, // the inbox has no pagination yet
      select: this.inboxSelect,
    });
  }

  // Platform staff: every chat on every restaurant, newest activity first.
  findAllForAdmin() {
    return this.prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: ADMIN_LIST_LIMIT,
      select: this.inboxSelect,
    });
  }

  // Loads a session and checks the actor may act on it. An owner asking about
  // another tenant's chat gets "not found" so session ids can't be probed.
  private async loadForActor(sessionId: string, actor: ChatActor) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, tenantId: true, endedAt: true },
    });
    if (!session || (actor.kind === 'owner' && session.tenantId !== actor.tenantId)) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  // Owner or admin replies into a visitor's chat. The bot goes quiet after this.
  async reply(sessionId: string, actor: ChatActor, dto: SendChatMessageDto) {
    const text = dto.text?.trim();
    if (!text) throw new BadRequestException('Message cannot be empty');

    const session = await this.loadForActor(sessionId, actor);
    if (session.endedAt) throw new BadRequestException('This chat has ended');

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { sessionId, from: actor.kind, text },
        select: messageSelect,
      }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { takenOver: true }, // @updatedAt bumps automatically
      }),
    ]);
    return message as MessageRow;
  }

  // Owner or admin ends a chat. Leaves a closing message so the visitor's
  // widget (which polls) shows who ended it, then no more messages are allowed.
  async close(sessionId: string, actor: ChatActor) {
    const session = await this.loadForActor(sessionId, actor);
    if (session.endedAt) return { ended: true, message: null };

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          sessionId,
          from: actor.kind,
          text:
            actor.kind === 'owner'
              ? 'This chat was ended by the restaurant.'
              : 'This chat was ended by the support team.',
        },
        select: messageSelect,
      }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date(), takenOver: true },
      }),
    ]);
    return { ended: true, message: message as MessageRow };
  }
}
