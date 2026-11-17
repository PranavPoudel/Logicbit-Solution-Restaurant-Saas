// chat-bot.service.ts — the auto-reply "brain" behind the chat widget.
//
// 1. Keyword rules answer from REAL database data (menu, prices, address,
//    phone, offers, payment methods, delivery/pickup/dine-in flags, ...).
// 2. If no rule matches, the optional AI model (ai-reply.service.ts) gets a
//    prompt built from the same real data. AI is off unless AI_PROVIDER is set.
// 3. If AI is off or fails, a generic "ask me about..." message is returned.
//
// Honest-data rules: this database stores NO opening hours and NO delivery
// time estimates, so the bot never states them. It only says whether the
// restaurant is currently open (Restaurant.isOpen).
//
// Output is plain text using only what the widget renders: **bold** and
// [label](https://link). Data inserted into replies is stripped of * [ ] ( ).
// Replies are English, or Japanese when the visitor wrote Japanese.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { haversineDistanceKm } from '../../common/utils/haversine.util';
import {
  AiChatMessage,
  AiReplyService,
  RestaurantAiContext,
} from './ai-reply.service';

interface RestaurantRow {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  refundPolicy: string | null;
  latitude: number | null;
  longitude: number | null;
  isOpen: boolean;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  supportsDineIn: boolean;
  maxDeliveryRadiusKm: number;
  avgRating: number;
  totalReviews: number;
  currencyCode: string;
  supportsCod: boolean;
  supportsCreditCard: boolean;
  supportsEsewa: boolean;
  supportsKhalti: boolean;
  supportsIps: boolean;
  supportsPhonePay: boolean;
  supportsPaypay: boolean;
  cuisines: { cuisine: { name: string } }[];
}

interface MenuRow {
  name: string;
  nameJa: string | null;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  spiceLevel: string | null;
  allergenInfo: string | null;
  ingredients: string | null;
  preparationTimeMinutes: number | null;
}

interface NearbyRow {
  name: string;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avgRating: number;
  isOpen: boolean;
}

interface OfferRow {
  code: string | null;
  type: string; // 'PERCENTAGE' | 'FLAT'
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isAutoApply: boolean;
}

const MENU_FETCH_LIMIT = 200;
const MENU_PREVIEW = 6;
const AI_MENU_LIMIT = 40;
const MAX_OFFERS_SHOWN = 5;
const MAX_ITEMS_DETAILED = 3;

// ---- intent patterns (English + the Japanese words the widget chips use) ----
const RE = {
  track: /\b(track\w*|my\s+orders?|order\s+status|where\s+is\s+my)\b|注文状況|追跡|注文履歴/i,
  greeting: /^\s*(hi|hello|hey|namaste)\b|^\s*(こんにちは|こんばんは|おはよう)/i,
  offers: /\b(coupons?|offers?|deals?|discounts?|promos?|promo\s*codes?|vouchers?)\b|クーポン|割引|セール|キャンペーン/i,
  refund: /\b(refunds?|money\s*back|cancel\w*|return\s+policy)\b|返金|キャンセル/i,
  dietary: /\b(vegetarian|vegan|veggie)\b|ベジタリアン|ビーガン|菜食/i,
  allergen: /\b(allerg\w*|ingredients?|spic(y|e|iness)|gluten|nuts?|calories)\b|アレルギー|原材料|辛/i,
  menu: /\b(menu|dish(es)?|food|eat|serve|prices?|cost|how\s+much|popular|recommend\w*|specials?|best)\b|メニュー|料理|値段|価格|おすすめ|いくら/i,
  dineIn: /\b(tables?|reserv\w*|book(ing)?|dine[\s-]*in|seating)\b|予約|席|テーブル/i,
  service: /\b(deliver\w*|pick[\s-]*up|take[\s-]*away|collect)\b|配達|デリバリー|持ち帰り|テイクアウト/i,
  hours: /\b(hours?|opening|open(\s+now)?|closed?|closing|what\s+time)\b|営業|開いて|何時/i,
  location: /\b(where|locat\w*|address|directions?|map|find\s+you|get\s+there)\b|場所|住所|地図|どこ|行き方/i,
  reviews: /\b(ratings?|rated|reviews?|stars?)\b|評価|レビュー|口コミ/i,
  payment: /\b(pay(ment)?s?|cash|cards?|esewa|khalti|paypay|cod)\b|支払|決済|現金|カード/i,
  contact: /\b(contact|phone|call|number|reach)\b|電話|連絡/i,
  cuisine: /\b(cuisines?|type\s+of\s+food|kind\s+of\s+food)\b|ジャンル|料理の種類/i,
};

const hasJapanese = (s: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(s);

// Same idea as the widget's chatSafe(): data must not break **bold**/[links].
const safe = (v: string | null | undefined) =>
  (v ?? '').replace(/[*[\]()]/g, '').replace(/\s+/g, ' ').trim();

const money = (n: number, currency: string) =>
  `${currency} ${Number.isInteger(n) ? n : n.toFixed(2)}`;

// Google Maps search link. Parentheses are escaped so they can't end a
// markdown [label](url) early in the widget.
const mapUrl = (query: string) => {
  const q = encodeURIComponent(query)
    .replace(/%20/g, '+')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};

@Injectable()
export class ChatBotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiReply: AiReplyService,
  ) {}

  // ===========================================================================
  // Per-restaurant chat
  // ===========================================================================

  async reply(
    restaurantId: string,
    userText: string,
    history: AiChatMessage[] = [],
  ): Promise<string> {
    const r = await this.loadRestaurant(restaurantId);
    if (!r) return this.genericFallback(null, hasJapanese(userText));

    const text = userText.trim();
    const ja = hasJapanese(text);
    const L = (en: string, jp: string) => (ja ? jp : en);
    const name = safe(r.name);
    const contact = r.phone ? ` (${safe(r.phone)})` : '';

    if (RE.track.test(text)) {
      return L(
        `📦 **Your order:**\n\nI can't see individual orders from this chat. Open your account and choose Orders to track it, or contact ${name}${contact}.`,
        `📦 **ご注文について:**\n\nこのチャットでは個別の注文を確認できません。アカウントの「注文」から追跡するか、${name}${contact}へご連絡ください。`,
      );
    }

    if (RE.greeting.test(text)) {
      return L(
        `Hello! I'm the assistant for ${name}. Ask me about the menu, offers, delivery, payment or how to reach us.`,
        `こんにちは！${name}のアシスタントです。メニュー、クーポン、配達、お支払い、連絡先などをお尋ねください。`,
      );
    }

    if (RE.offers.test(text)) {
      const offers = await this.loadOffers(r);
      if (!offers.length) {
        return L(
          `🎟️ **Offers:**\n\n${name} has no active offers right now.`,
          `🎟️ **クーポン:**\n\n現在、${name}で利用できるクーポンはありません。`,
        );
      }
      return `🎟️ **${L('Offers at', 'クーポン:')} ${name}:**\n\n${offers
        .slice(0, MAX_OFFERS_SHOWN)
        .map((o) => `• ${this.describeOffer(o, r.currencyCode, ja)}`)
        .join('\n')}`;
    }

    if (RE.refund.test(text)) {
      return r.refundPolicy
        ? `💸 **${L('Refund policy', '返金ポリシー')}:**\n\n${safe(r.refundPolicy).slice(0, 500)}`
        : L(
            `💸 **Refund policy:**\n\n${name} hasn't published a refund policy. Please contact them directly${contact}.`,
            `💸 **返金ポリシー:**\n\n${name}は返金ポリシーを公開していません。直接お問い合わせください${contact}。`,
          );
    }

    let menu: MenuRow[] | null = null;
    const getMenu = async () => (menu ??= await this.loadMenu(r.id));

    if (RE.dietary.test(text)) {
      const wantVegan = /vegan|ビーガン/i.test(text);
      const picks = (await getMenu()).filter(
        (m) => m.isAvailable && (wantVegan ? m.isVegan : m.isVegetarian || m.isVegan),
      );
      const label = wantVegan ? L('Vegan', 'ビーガン') : L('Vegetarian', 'ベジタリアン');
      if (!picks.length) {
        return L(
          `🥗 **${label} options:**\n\n${name} hasn't marked any dishes as ${label.toLowerCase()}. Please ask them directly${contact}.`,
          `🥗 **${label}メニュー:**\n\n${name}では${label}と表示されている料理がありません。直接お問い合わせください${contact}。`,
        );
      }
      return `🥗 **${label} ${L('options at', 'メニュー:')} ${name}:**\n\n${this.listItems(picks.slice(0, 8), r.currencyCode, ja)}${picks.length > 8 ? '\n' + L(`…and ${picks.length - 8} more.`, `…ほか${picks.length - 8}品`) : ''}`;
    }

    // Menu / price / allergen questions: if the visitor named a dish, answer
    // about that dish from the database.
    const wantsMenu = RE.menu.test(text);
    const wantsAllergen = RE.allergen.test(text);
    if (wantsMenu || wantsAllergen) {
      const matched = this.matchItems(await getMenu(), text);
      if (matched.length) return this.itemReply(matched, r, ja, wantsAllergen, contact);
      if (wantsAllergen && !wantsMenu) {
        return L(
          `🍽️ **Dish details:**\n\nTell me which dish you're asking about and I'll share its ingredients and allergen info if ${name} has listed them.`,
          `🍽️ **料理の詳細:**\n\nどの料理についてか教えてください。${name}が登録している原材料やアレルギー情報をお伝えします。`,
        );
      }
      const available = (await getMenu()).filter((m) => m.isAvailable);
      if (!available.length) {
        return L(
          `🍽️ **Menu:**\n\n${name} hasn't added menu items yet.`,
          `🍽️ **メニュー:**\n\n${name}はまだメニューを登録していません。`,
        );
      }
      const more = available.length - MENU_PREVIEW;
      return `🍽️ **${L('Menu highlights at', 'メニュー:')} ${name}:**\n\n${this.listItems(available.slice(0, MENU_PREVIEW), r.currencyCode, ja)}${more > 0 ? '\n\n' + L(`…and ${more} more on this page's menu.`, `…ほか${more}品はこのページのメニューをご覧ください。`) : ''}`;
    }

    if (RE.dineIn.test(text)) {
      return r.supportsDineIn
        ? L(
            `🪑 **Dine-in:**\n\n${name} offers dine-in. I can't book tables from this chat, so please call to reserve${contact}.`,
            `🪑 **店内飲食:**\n\n${name}は店内飲食に対応しています。このチャットでは席の予約はできませんので、お電話でご予約ください${contact}。`,
          )
        : L(
            `🪑 **Dine-in:**\n\n${name} doesn't list dine-in. ${this.serviceSummary(r, false)}`,
            `🪑 **店内飲食:**\n\n${name}は店内飲食を案内していません。${this.serviceSummary(r, true)}`,
          );
    }

    if (RE.service.test(text)) {
      return `🛵 **${L('Ordering options', 'ご利用方法')}:**\n\n${this.serviceSummary(r, ja)}\n\n${L(
        "I don't have a delivery time estimate; the delivery fee is shown when you check out.",
        '配達時間の目安は分かりません。配達料金はお会計時に表示されます。',
      )}`;
    }

    if (RE.hours.test(text)) {
      return L(
        `⏰ **Opening status:**\n\n${name} is currently ${r.isOpen ? 'open and accepting orders' : 'closed'}. Specific opening hours aren't listed, so it's best to call ahead${contact}.`,
        `⏰ **営業状況:**\n\n${name}は現在${r.isOpen ? '営業中で注文を受け付けています' : '営業しておりません'}。具体的な営業時間は登録されていないため、お電話でご確認ください${contact}。`,
      );
    }

    if (RE.location.test(text)) {
      const where = [r.address, r.city].filter(Boolean).map(safe).join(', ');
      if (!where && r.latitude == null) {
        return L(
          `📍 **Address:**\n\n${name} hasn't listed an address yet.`,
          `📍 **住所:**\n\n${name}はまだ住所を登録していません。`,
        );
      }
      const query =
        r.latitude != null && r.longitude != null ? `${r.latitude},${r.longitude}` : `${name} ${where}`;
      return `📍 **${L('Address', '住所')}:**\n${where || name}\n\n🗺️ [${L('View on map', '地図で見る')}](${mapUrl(query)})`;
    }

    if (RE.reviews.test(text)) {
      return r.totalReviews > 0
        ? L(
            `⭐ **Reviews:**\n\n${r.avgRating.toFixed(1)}★ from ${r.totalReviews} review${r.totalReviews === 1 ? '' : 's'}.`,
            `⭐ **レビュー:**\n\n${r.totalReviews}件のレビューで${r.avgRating.toFixed(1)}★です。`,
          )
        : L(
            `⭐ **Reviews:**\n\n${name} doesn't have any reviews yet.`,
            `⭐ **レビュー:**\n\n${name}にはまだレビューがありません。`,
          );
    }

    if (RE.payment.test(text)) {
      const methods = this.paymentMethods(r);
      return methods.length
        ? `💳 **${L('Payment methods', 'お支払い方法')}:**\n\n${methods.join(', ')}`
        : L(
            `💳 **Payment methods:**\n\n${name} hasn't listed accepted payment methods. Please ask them directly${contact}.`,
            `💳 **お支払い方法:**\n\n${name}は対応する支払い方法を登録していません。直接お問い合わせください${contact}。`,
          );
    }

    if (RE.contact.test(text)) {
      return r.phone
        ? `📞 **${L('Phone number', '電話番号')}:**\n${safe(r.phone)}`
        : L(
            `📞 **Contact:**\n\n${name} hasn't listed a phone number yet.`,
            `📞 **連絡先:**\n\n${name}はまだ電話番号を登録していません。`,
          );
    }

    if (RE.cuisine.test(text)) {
      const cuisines = r.cuisines.map((c) => safe(c.cuisine.name)).filter(Boolean);
      return cuisines.length
        ? `🍜 **${L('Cuisine', 'ジャンル')}:**\n\n${cuisines.join(', ')}`
        : L(
            `🍜 **Cuisine:**\n\n${name} hasn't listed a cuisine type.`,
            `🍜 **ジャンル:**\n\n${name}はジャンルを登録していません。`,
          );
    }

    // No keyword matched. A bare dish name ("momo?") still deserves a real
    // answer from the database before we involve the AI.
    const dishes = this.matchItems(await getMenu(), text);
    if (dishes.length) return this.itemReply(dishes, r, ja, false, contact);

    const ai = await this.aiReply.generateReply(
      await this.buildAiContext(r, await getMenu()),
      history,
      text,
    );
    return ai ?? this.genericFallback(name, ja);
  }

  // ===========================================================================
  // General chat (no restaurant open). Stateless, nothing is stored.
  // `reply` is null when AI is off/failed so the widget can use its canned
  // answers instead.
  // ===========================================================================

  async generalReply(
    message: string,
    rawHistory: unknown,
    latitude?: number,
    longitude?: number,
  ): Promise<string | null> {
    const text = message.trim();
    if (!text) return null;

    if (this.isNearbyIntent(text)) {
      return this.nearbyReply(latitude, longitude, hasJapanese(text));
    }

    const history: AiChatMessage[] = Array.isArray(rawHistory)
      ? rawHistory
          .filter(
            (m): m is { from: string; text: string } =>
              !!m &&
              typeof m.from === 'string' &&
              typeof m.text === 'string' &&
              m.text.trim().length > 0,
          )
          // Staff messages only exist inside restaurant chats; treat anything
          // that isn't the visitor as the assistant.
          .map((m) => ({ from: m.from === 'user' ? 'user' : 'bot', text: m.text.slice(0, 800) }))
      : [];

    return this.aiReply.generateGeneralReply(text, history);
  }

  // Also catches common typos ("closet", "nearset").
  private isNearbyIntent(text: string): boolean {
    const t = text.toLowerCase();
    if (/\bnear\s*by\b/.test(t)) return true;
    if (/\b(near|nearer|close|closer)\s*(to\s*)?(me|here|my)\b/.test(t)) return true;
    if (/\baround\s*(me|here)\b/.test(t)) return true;
    if (/近く|最寄り|近い/.test(text)) return true;
    const superlative = /\b(closest|closet|closes|closeset|clossest|nearest|nearset|neares|neerest)\b/.test(t);
    const target = /\b(restaurants?|kitchens?|places?|spots?|cafes?|food|ones?)\b/.test(t);
    return superlative && (target || /\b(me|here)\b/.test(t));
  }

  private async nearbyReply(latitude: number | undefined, longitude: number | undefined, ja: boolean): Promise<string> {
    const L = (en: string, jp: string) => (ja ? jp : en);
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return L(
        '📍 **Location needed:**\n\nI need your location to find the closest restaurants. Please allow location access in your browser and ask again.',
        '📍 **位置情報が必要です:**\n\n最寄りのレストランを探すには位置情報が必要です。ブラウザで位置情報を許可してからもう一度お尋ねください。',
      );
    }

    // Only the few columns needed. Distances are computed here (exact, never
    // model-guessed). Fine for a modest number of restaurants; if the platform
    // grows large, move this to a bounding-box SQL query like Discovery does.
    const rows: NearbyRow[] = await this.prisma.restaurant.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
      select: { name: true, address: true, city: true, latitude: true, longitude: true, avgRating: true, isOpen: true },
      take: 2000,
    });
    const closest = rows
      .map((x) => ({ ...x, km: haversineDistanceKm(latitude, longitude, x.latitude as number, x.longitude as number) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);

    if (!closest.length) {
      return L(
        "📍 **Nearby restaurants:**\n\nI couldn't find any restaurants with a location on file yet.",
        '📍 **近くのレストラン:**\n\n位置情報が登録されているレストランが見つかりませんでした。',
      );
    }

    const blocks = closest.map((x, i) => {
      const where = [x.address, x.city].filter(Boolean).map(safe).join(', ');
      const rating = x.avgRating ? ` · ${x.avgRating.toFixed(1)}★` : '';
      const status = x.isOpen ? '' : ` · ${L('closed now', '営業時間外')}`;
      return [
        `${i + 1}. **${safe(x.name)}** — ${x.km.toFixed(1)} km${L(' away', '')}${rating}${status}`,
        where ? `📍 ${where}` : null,
        `🗺️ [${L('View on map', '地図で見る')}](${mapUrl(`${x.latitude},${x.longitude}`)})`,
      ]
        .filter(Boolean)
        .join('\n');
    });
    return `📍 **${L('Closest restaurants to you', 'あなたに近いレストラン')}:**\n\n${blocks.join('\n\n')}`;
  }

  // ===========================================================================
  // Data loading
  // ===========================================================================

  private async loadRestaurant(id: string): Promise<RestaurantRow | null> {
    const row = await this.prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true, tenantId: true, name: true, address: true, city: true, phone: true,
        refundPolicy: true, latitude: true, longitude: true, isOpen: true,
        supportsDelivery: true, supportsPickup: true, supportsDineIn: true,
        maxDeliveryRadiusKm: true, avgRating: true, totalReviews: true, currencyCode: true,
        supportsCod: true, supportsCreditCard: true, supportsEsewa: true, supportsKhalti: true,
        supportsIps: true, supportsPhonePay: true, supportsPaypay: true,
        stripeSecretKey: true,
        cuisines: { select: { cuisine: { select: { name: true } } } },
      },
    });
    if (!row) return null;
    // The chatbot must not tell customers they can pay by card when checkout would refuse it (no Stripe key saved).
    // The key itself is dropped here and never reaches the reply.
    const { stripeSecretKey, ...rest } = row;
    return { ...rest, supportsCreditCard: rest.supportsCreditCard && !!stripeSecretKey };
  }

  private loadMenu(restaurantId: string): Promise<MenuRow[]> {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, deletedAt: null },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      take: MENU_FETCH_LIMIT,
      select: {
        name: true, nameJa: true, description: true, price: true, isAvailable: true,
        isVegetarian: true, isVegan: true, spiceLevel: true, allergenInfo: true,
        ingredients: true, preparationTimeMinutes: true,
      },
    });
  }

  // Offers a visitor could use here: this restaurant's own coupons plus
  // tenant-wide ones (restaurantId null), active, not deleted, within dates,
  // and not used up.
  private async loadOffers(r: RestaurantRow): Promise<OfferRow[]> {
    const now = new Date();
    const rows: OfferRow[] = await this.prisma.coupon.findMany({
      where: {
        tenantId: r.tenantId,
        isActive: true,
        deletedAt: null,
        validFrom: { lte: now },
        AND: [
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          { OR: [{ restaurantId: null }, { restaurantId: r.id }] },
          { OR: [{ code: { not: null } }, { isAutoApply: true }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        code: true, type: true, value: true, maxDiscount: true, minOrderAmount: true,
        usageLimit: true, usedCount: true, isAutoApply: true,
      },
    });
    return rows.filter((o) => o.usageLimit == null || o.usedCount < o.usageLimit);
  }

  private async buildAiContext(r: RestaurantRow, menu: MenuRow[]): Promise<RestaurantAiContext> {
    const offers = await this.loadOffers(r);
    return {
      name: safe(r.name),
      address: r.address,
      city: r.city,
      phone: r.phone,
      isOpen: r.isOpen,
      supportsDelivery: r.supportsDelivery,
      supportsPickup: r.supportsPickup,
      supportsDineIn: r.supportsDineIn,
      paymentMethods: this.paymentMethods(r),
      cuisines: r.cuisines.map((c) => safe(c.cuisine.name)).filter(Boolean),
      refundPolicy: r.refundPolicy ? safe(r.refundPolicy).slice(0, 500) : null,
      avgRating: r.avgRating,
      totalReviews: r.totalReviews,
      currencyCode: r.currencyCode,
      menu: menu.filter((m) => m.isAvailable).slice(0, AI_MENU_LIMIT).map((m) => ({ name: safe(m.name), price: m.price })),
      offers: offers.slice(0, MAX_OFFERS_SHOWN).map((o) => this.describeOffer(o, r.currencyCode, false)),
    };
  }

  // ===========================================================================
  // Formatting helpers
  // ===========================================================================

  private paymentMethods(r: RestaurantRow): string[] {
    return [
      r.supportsCod && 'Cash on delivery',
      r.supportsCreditCard && 'Credit card',
      r.supportsEsewa && 'eSewa',
      r.supportsKhalti && 'Khalti',
      r.supportsIps && 'IPS',
      r.supportsPhonePay && 'PhonePay',
      r.supportsPaypay && 'PayPay',
    ].filter((x): x is string => typeof x === 'string');
  }

  private serviceSummary(r: RestaurantRow, ja: boolean): string {
    const parts: string[] = [];
    if (r.supportsDelivery) {
      parts.push(
        ja
          ? `配達（約${r.maxDeliveryRadiusKm}km圏内）`
          : `Delivery (within about ${r.maxDeliveryRadiusKm} km)`,
      );
    }
    if (r.supportsPickup) parts.push(ja ? '持ち帰り' : 'Pickup');
    if (r.supportsDineIn) parts.push(ja ? '店内飲食' : 'Dine-in');
    if (!parts.length) {
      return ja ? '現在、対応している受け取り方法は登録されていません。' : 'No ordering options are listed right now.';
    }
    return (ja ? '対応: ' : 'Available: ') + parts.join(ja ? '、' : ', ') + (ja ? '。' : '.');
  }

  private describeOffer(o: OfferRow, currency: string, ja: boolean): string {
    const L = (en: string, jp: string) => (ja ? jp : en);
    const value =
      o.type === 'PERCENTAGE'
        ? L(`${o.value}% off`, `${o.value}%オフ`)
        : L(`${money(o.value, currency)} off`, `${money(o.value, currency)}オフ`);
    const cap = o.type === 'PERCENTAGE' && o.maxDiscount ? L(`, up to ${money(o.maxDiscount, currency)}`, `（最大${money(o.maxDiscount, currency)}）`) : '';
    const min = o.minOrderAmount && o.minOrderAmount > 0 ? L(`, min order ${money(o.minOrderAmount, currency)}`, `、${money(o.minOrderAmount, currency)}以上のご注文`) : '';
    const label = o.code ? `**${safe(o.code)}**` : L('Automatic', '自動適用');
    return `${label}: ${value}${cap}${min}`;
  }

  private listItems(items: MenuRow[], currency: string, ja: boolean): string {
    return items
      .map((m) => `• ${safe(ja && m.nameJa ? m.nameJa : m.name)} — ${money(m.price, currency)}`)
      .join('\n');
  }

  // Dishes whose name appears in the visitor's message.
  private matchItems(menu: MenuRow[], text: string): MenuRow[] {
    const t = text.toLowerCase();
    return menu
      .filter((m) => {
        const en = m.name.trim().toLowerCase();
        const jp = (m.nameJa ?? '').trim().toLowerCase();
        return (en.length >= 3 && t.includes(en)) || (jp.length >= 2 && t.includes(jp));
      })
      .slice(0, MAX_ITEMS_DETAILED);
  }

  private itemReply(items: MenuRow[], r: RestaurantRow, ja: boolean, askedAllergen: boolean, contact: string): string {
    const L = (en: string, jp: string) => (ja ? jp : en);
    const blocks = items.map((m) => {
      const lines = [`**${safe(ja && m.nameJa ? m.nameJa : m.name)}** — ${money(m.price, r.currencyCode)}`];
      if (!m.isAvailable) lines.push(L('Currently unavailable.', '現在ご利用いただけません。'));
      if (m.description) lines.push(safe(m.description).slice(0, 160));
      const tags = [
        m.isVegan && L('Vegan', 'ビーガン'),
        !m.isVegan && m.isVegetarian && L('Vegetarian', 'ベジタリアン'),
        m.spiceLevel && `${L('Spice', '辛さ')}: ${safe(m.spiceLevel)}`,
        m.preparationTimeMinutes && L(`Prep time: ${m.preparationTimeMinutes} min`, `調理時間: ${m.preparationTimeMinutes}分`),
      ].filter((x): x is string => typeof x === 'string');
      if (tags.length) lines.push(tags.join(' · '));
      if (m.ingredients) lines.push(`${L('Ingredients', '原材料')}: ${safe(m.ingredients).slice(0, 200)}`);
      if (m.allergenInfo) lines.push(`${L('Allergens', 'アレルギー情報')}: ${safe(m.allergenInfo).slice(0, 200)}`);
      else if (askedAllergen) {
        lines.push(L(`No allergen info is listed. Please ask ${safe(r.name)} directly${contact}.`, `アレルギー情報は登録されていません。${safe(r.name)}へ直接お問い合わせください${contact}。`));
      }
      return lines.join('\n');
    });
    return `🍽️ ${blocks.join('\n\n')}`;
  }

  private genericFallback(name: string | null, ja: boolean): string {
    const en = `Sorry, I didn't understand that. You can ask me about the menu and prices, offers, delivery or pickup, address, payment methods, reviews or contact info${name ? ` for ${name}` : ''}.`;
    const jp = 'すみません、よく分かりませんでした。メニューや価格、クーポン、配達・持ち帰り、住所、お支払い方法、レビュー、連絡先についてお尋ねください。';
    return ja ? jp : en;
  }
}
