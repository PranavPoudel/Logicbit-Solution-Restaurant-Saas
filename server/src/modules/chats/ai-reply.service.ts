// ai-reply.service.ts — optional AI fallback for chats.service.ts.
//
// Used only when the keyword rules in ChatsService don't match anything.
// It NEVER throws: whenever AI is off, not configured, slow or failing it
// returns null, and the caller falls back to its generic reply. The widget
// therefore keeps working with AI_PROVIDER=none (the default).
//
// Env (all optional):
//   AI_PROVIDER       anthropic | openai | groq | none   (default: none)
//   AI_MODEL          overrides the default model of the chosen provider
//   ANTHROPIC_API_KEY / OPENAI_API_KEY / GROQ_API_KEY
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiChatMessage {
  from: string; // 'bot' | 'user' | 'owner' | 'admin'
  text: string;
}

// Real restaurant data only. ChatsService fills this from the database so
// the model is never given (and told not to invent) anything else.
export interface RestaurantAiContext {
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  isOpen: boolean;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  supportsDineIn: boolean;
  paymentMethods: string[]; // human-readable, e.g. ['Cash on delivery', 'eSewa']
  cuisines: string[];
  refundPolicy?: string | null;
  avgRating: number;
  totalReviews: number;
  currencyCode: string;
  menu: { name: string; price: number }[]; // already limited by the caller
  offers: string[]; // e.g. ['WELCOME10 - 10% off']
}

type Provider = 'anthropic' | 'openai' | 'groq';
type ProviderMessage = { role: 'user' | 'assistant'; content: string };

const MAX_HISTORY_MESSAGES = 8; // keep the prompt small and cheap
const MAX_USER_TEXT_LENGTH = 800; // guard against pasted essays / abuse
const MAX_MENU_ITEMS_IN_PROMPT = 40;
const REQUEST_TIMEOUT_MS = 8000;

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-haiku-5-5',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
};

@Injectable()
export class AiReplyService {
  private readonly logger = new Logger(AiReplyService.name);

  constructor(private readonly config: ConfigService) {}

  // Per-restaurant assistant (chat opened on a restaurant's page).
  async generateReply(
    restaurant: RestaurantAiContext,
    history: AiChatMessage[],
    userText: string,
  ): Promise<string | null> {
    return this.run(this.buildRestaurantPrompt(restaurant), history, userText);
  }

  // Platform-wide assistant used when no restaurant page is open. Stateless,
  // no database access.
  async generateGeneralReply(
    userText: string,
    history: AiChatMessage[] = [],
  ): Promise<string | null> {
    const systemPrompt = [
      'You are the AI assistant for LogicBit, a platform where people discover restaurants, order food for delivery or pickup, and book tables.',
      'You help visitors find restaurants (they can browse and filter on the home page), understand how ordering, payment and reservations work, and answer general friendly questions.',
      'Do not invent facts about specific restaurants (menu, prices, opening hours, delivery times). If asked about a particular restaurant, tell the visitor to open that restaurant\'s page, where its chat can answer in detail.',
      'Reply in the language the visitor writes in (English or Japanese).',
      'Keep answers friendly and concise (a few sentences).',
    ].join('\n');
    return this.run(systemPrompt, history, userText);
  }

  // ---------------------------------------------------------------------------

  private async run(
    systemPrompt: string,
    history: AiChatMessage[],
    userText: string,
  ): Promise<string | null> {
    const provider = (this.config.get<string>('AI_PROVIDER') ?? 'none')
      .trim()
      .toLowerCase();
    if (provider === 'none' || provider === '') return null;
    if (!this.isProvider(provider)) {
      this.logger.warn(`Unknown AI_PROVIDER: ${provider}`);
      return null;
    }

    const text = (userText ?? '').slice(0, MAX_USER_TEXT_LENGTH).trim();
    if (!text) return null;

    const messages = this.toProviderMessages(
      Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : [],
      text,
    );

    try {
      switch (provider) {
        case 'anthropic':
          return await this.callAnthropic(systemPrompt, messages);
        case 'openai':
          return await this.callOpenAiCompatible(
            'OpenAI',
            'https://api.openai.com/v1/chat/completions',
            'OPENAI_API_KEY',
            provider,
            systemPrompt,
            messages,
            300,
          );
        case 'groq':
          // Groq is OpenAI-compatible. gpt-oss models "think" first and that
          // counts against max_tokens, so allow more room (else empty reply).
          return await this.callOpenAiCompatible(
            'Groq',
            'https://api.groq.com/openai/v1/chat/completions',
            'GROQ_API_KEY',
            provider,
            systemPrompt,
            messages,
            800,
          );
      }
    } catch (err) {
      // Includes timeouts (AbortError) and network failures.
      this.logger.error(`AI reply failed: ${(err as Error)?.message ?? err}`);
    }
    return null;
  }

  private isProvider(value: string): value is Provider {
    return value === 'anthropic' || value === 'openai' || value === 'groq';
  }

  private model(provider: Provider): string {
    return this.config.get<string>('AI_MODEL')?.trim() || DEFAULT_MODELS[provider];
  }

  // Only real restaurant data goes in here, so the model can't state prices,
  // hours or policies it was never given. This SaaS stores no opening hours or
  // delivery times, so the prompt says so explicitly.
  private buildRestaurantPrompt(r: RestaurantAiContext): string {
    const modes = [
      r.supportsDelivery ? 'delivery' : null,
      r.supportsPickup ? 'pickup' : null,
      r.supportsDineIn ? 'dine-in' : null,
    ].filter(Boolean);

    const location = [r.address, r.city].filter(Boolean).join(', ');
    const menu = r.menu
      .slice(0, MAX_MENU_ITEMS_IN_PROMPT)
      .map((m) => `${m.name} (${m.price} ${r.currencyCode})`)
      .join('; ');

    const lines = [
      `You are the AI assistant for the restaurant "${r.name}".`,
      'Answer visitors\' questions using ONLY the restaurant information below.',
      'Do not invent anything that is not listed: especially opening hours, delivery times, ingredients, allergens, dishes or prices. If something is not listed, say you don\'t know and suggest contacting the restaurant directly.',
      'You may chat naturally about general, non-restaurant-specific topics.',
      'Reply in the language the visitor writes in (English or Japanese).',
      'Be friendly and concise (a few sentences).',
      '',
      'Restaurant information:',
      `Currently accepting orders: ${r.isOpen ? 'yes' : 'no (currently closed)'}`,
      `Location: ${location || 'not listed'}`,
      r.phone ? `Phone: ${r.phone}` : null,
      modes.length ? `Service options: ${modes.join(', ')}` : null,
      r.paymentMethods.length ? `Payment methods: ${r.paymentMethods.join(', ')}` : null,
      r.cuisines.length ? `Cuisines: ${r.cuisines.join(', ')}` : null,
      r.totalReviews > 0
        ? `Rating: ${r.avgRating.toFixed(1)}/5 from ${r.totalReviews} reviews`
        : null,
      r.refundPolicy ? `Refund policy: ${r.refundPolicy}` : null,
      menu ? `Menu: ${menu}` : null,
      r.offers.length ? `Active offers: ${r.offers.join('; ')}` : null,
    ];

    return lines.filter((l) => l !== null).join('\n');
  }

  private toProviderMessages(
    history: AiChatMessage[],
    userText: string,
  ): ProviderMessage[] {
    // History comes from the client (general chat) so treat it as untrusted:
    // keep only well-formed entries and cap each one's length.
    const mapped: ProviderMessage[] = history
      .filter((m) => m && typeof m.text === 'string' && typeof m.from === 'string')
      .map((m) => ({
        role: m.from === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text.slice(0, MAX_USER_TEXT_LENGTH),
      }))
      .filter((m) => m.content.trim().length > 0);

    // The widget's greeting is a bot message, so history often starts with an
    // assistant turn: Anthropic rejects that. Drop leading assistant turns.
    while (mapped.length && mapped[0].role !== 'user') mapped.shift();

    // The latest user message is passed separately; if the history already
    // ends with that same text, don't send it twice.
    const last = mapped[mapped.length - 1];
    if (last && last.role === 'user' && last.content === userText) mapped.pop();

    // Providers want alternating turns: merge consecutive same-role messages
    // (can happen when an owner/admin reply sits next to bot replies).
    const merged: ProviderMessage[] = [];
    for (const m of [...mapped, { role: 'user' as const, content: userText }]) {
      const prev = merged[merged.length - 1];
      if (prev && prev.role === m.role) prev.content += `\n${m.content}`;
      else merged.push({ ...m });
    }
    return merged;
  }

  // One POST with an 8 s timeout covering the whole request and body read.
  private async postJson(
    label: string,
    url: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<any | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        this.logger.error(`${label} API error ${res.status}: ${detail}`);
        return null;
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callAnthropic(
    systemPrompt: string,
    messages: ProviderMessage[],
  ): Promise<string | null> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set');
      return null;
    }
    const data = await this.postJson(
      'Anthropic',
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      {
        model: this.model('anthropic'),
        max_tokens: 300,
        system: systemPrompt,
        messages,
      },
    );
    const text = data?.content
      ?.filter((block: { type: string }) => block.type === 'text')
      ?.map((block: { text: string }) => block.text)
      ?.join('')
      ?.trim();
    return text || null;
  }

  // OpenAI and Groq share the same request/response shape.
  private async callOpenAiCompatible(
    label: string,
    url: string,
    keyName: string,
    provider: Provider,
    systemPrompt: string,
    messages: ProviderMessage[],
    maxTokens: number,
  ): Promise<string | null> {
    const apiKey = this.config.get<string>(keyName);
    if (!apiKey) {
      this.logger.warn(`AI_PROVIDER=${provider} but ${keyName} is not set`);
      return null;
    }
    const model = this.model(provider);
    const data = await this.postJson(
      label,
      url,
      { Authorization: `Bearer ${apiKey}` },
      {
        model,
        max_tokens: maxTokens,
        ...(provider === 'groq' && model.includes('gpt-oss')
          ? { reasoning_effort: 'low' }
          : {}),
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      },
    );
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  }
}
