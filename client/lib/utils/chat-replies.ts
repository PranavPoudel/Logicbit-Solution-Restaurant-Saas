import type { ChatRestaurant } from "@/store/chat-context-store";
import { chatSafe } from "@/lib/utils/chat-text";

export interface ChatReply {
  key: string;
  values?: Record<string, string>;
  href?: string;
  action?: string;
}

export interface QuickReply {
  id: string;
  icon: string;
}

type Intent = { key: string; re: RegExp; href?: string };

const GENERAL: Intent[] = [
  { key: "orders", re: /order|track|where|status|注文|追跡/i, href: "/account?tab=orders" },
  { key: "restaurants", re: /restaurant|food|eat|hungry|cuisine|menu|レストラン|食/i, href: "/restaurants" },
  { key: "offers", re: /coupon|offer|deal|discount|promo|クーポン|割引/i, href: "/restaurants" },
  { key: "refund", re: /refund|money back|wrong|missing|spoiled|返金/i },
  { key: "delivery", re: /deliver|rider|fee|late|配達/i },
  { key: "hello", re: /^(hi|hello|hey|namaste)|こんにちは/i },
];

const RESTAURANT: Intent[] = [
  { key: "orders", re: /track|my order|status|注文履歴|追跡/i, href: "/account?tab=orders" },
  { key: "refund", re: /refund|money back|wrong|missing|spoiled|返金/i },
  { key: "hello", re: /^(hi|hello|hey|namaste)|こんにちは/i },
  { key: "offersHere", re: /coupon|offer|deal|discount|promo|クーポン|割引/i, href: "#offers" },
  { key: "contact", re: /contact|phone|call|number|電話/i, href: "#find" },
  { key: "hours", re: /open|hour|close|when|営業/i },
  { key: "location", re: /where|locat|address|direction|map|場所|住所/i, href: "#find" },
  { key: "delivery", re: /deliver|fee|how long|time|配達/i },
  { key: "menu", re: /menu|dish|food|eat|order|serve|メニュー|料理/i, href: "#menu" },
];

const GENERAL_QUICK: QuickReply[] = [
  { id: "orders", icon: "bag" },
  { id: "restaurants", icon: "search" },
  { id: "offers", icon: "ticket" },
  { id: "refund", icon: "info" },
];

export function quickRepliesFor(restaurant: ChatRestaurant | null): QuickReply[] {
  if (!restaurant) return GENERAL_QUICK;
  return [
    { id: "menu", icon: "utensils" },
    { id: "hours", icon: "clock" },
    { id: "location", icon: "pin" },
    { id: "contact", icon: "phone" },
    { id: "delivery", icon: "bike" },
    ...(restaurant.offerCodes.length ? [{ id: "offersHere", icon: "ticket" }] : []),
  ];
}

const MENU_PREVIEW = 5;

function restaurantReply(key: string, r: ChatRestaurant, intent?: Intent): ChatReply {
  const name = chatSafe(r.name);
  const href = intent?.href;
  switch (key) {
    case "menu":
      return r.categories.length
        ? { key, values: { name, categories: r.categories.slice(0, MENU_PREVIEW).map(chatSafe).join(", ") }, href }
        : { key: "menuEmpty", values: { name } };
    case "hours":
      return r.isOpen
        ? r.closesAt ? { key: "hoursOpenUntil", values: { name, time: chatSafe(r.closesAt) } } : { key: "hoursOpen", values: { name } }
        : r.opensAt ? { key: "hoursClosedOpens", values: { name, opens: chatSafe(r.opensAt) } } : { key: "hoursClosed", values: { name } };
    case "location":
      return r.address ? { key, values: { name, address: chatSafe(r.address) }, href } : { key: "locationMissing", values: { name } };
    case "contact":
      return r.phone ? { key, values: { name, phone: chatSafe(r.phone) }, href: `tel:${r.phone}` } : { key: "contactMissing", values: { name }, href };
    case "delivery":
      return r.deliveryMinutes != null ? { key: "deliveryHere", values: { name, minutes: String(r.deliveryMinutes) } } : { key: "deliveryNoEta", values: { name } };
    case "offersHere":
      return r.offerCodes.length ? { key, values: { name, codes: r.offerCodes.slice(0, 3).map(chatSafe).join(", ") }, href } : { key: "offersNone", values: { name } };
    default:
      return { key, values: { name }, href };
  }
}

export function resolveReply(text: string, forcedKey: string | undefined, restaurant: ChatRestaurant | null, who: string): ChatReply {
  const intents = restaurant ? RESTAURANT : GENERAL;
  const intent = forcedKey ? intents.find((i) => i.key === forcedKey) : intents.find((i) => i.re.test(text));
  if (!intent) return { key: restaurant ? "fallbackRestaurant" : "fallback", values: restaurant ? { name: chatSafe(restaurant.name) } : undefined };
  if (intent.key === "hello") return { key: who ? "helloNamed" : "hello", values: { name: chatSafe(who) } };
  const reply = restaurant && intent.key !== "orders" && intent.key !== "refund" ? restaurantReply(intent.key, restaurant, intent) : { key: intent.key, href: intent.href };
  return reply.href ? { ...reply, action: intent.key } : reply;
}
