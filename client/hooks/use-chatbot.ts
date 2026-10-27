import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useChatContextStore } from "@/store/chat-context-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { quickRepliesFor, resolveReply } from "@/lib/utils/chat-replies";
import { chatSafe } from "@/lib/utils/chat-text";

export type ChatMessage = { id: string; from: "bot" | "user"; key?: string; values?: Record<string, string>; text?: string; href?: string; action?: string };
type Threads = Record<string, ChatMessage[]>;

const STORAGE_KEY = "chat-threads";
const MAX_THREADS = 8;
const MAX_MESSAGES = 40;
const REPLY_DELAY_MS = 900;

const EMPTY: Threads = {};
const listeners = new Set<() => void>();
let cache: Threads | null = null;
let counter = 0;

const newId = () => `${Date.now()}-${counter++}`;

function readThreads(): Threads {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Threads) : {};
  } catch {
    return {};
  }
}

function updateThreads(change: (threads: Threads) => Threads) {
  const kept = Object.entries(change((cache ??= readThreads()))).slice(-MAX_THREADS).map(([k, m]) => [k, m.slice(-MAX_MESSAGES)]);
  cache = Object.fromEntries(kept);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage blocked (private mode): the chat just won't resume.
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
const getSnapshot = () => (cache ??= readThreads());
const getServerSnapshot = () => EMPTY;

const greeting = (name?: string): ChatMessage[] => [
  name ? { id: "g0", from: "bot", key: "greetingRestaurant", values: { name: chatSafe(name) } } : { id: "g0", from: "bot", key: "greeting" },
  { id: "g1", from: "bot", key: "help" },
];

export function useChatbot() {
  const restaurant = useChatContextStore((s) => s.restaurant);
  const customer = useCustomerAuthStore((s) => s.customer);
  const threads = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const contextKey = `${customer?.id ?? "guest"}:${restaurant?.id ?? "general"}`;

  const [typingKey, setTypingKey] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const messages = threads[contextKey] ?? greeting(restaurant?.name);
  const typing = typingKey === contextKey;
  const canEnd = messages.some((m) => m.from === "user");
  const askName = !!restaurant && !customer && !canEnd && !typing;
  const who = customer?.name ?? visitorName.trim();

  const append = (key: string, base: ChatMessage[], added: ChatMessage[]) =>
    updateThreads((t) => ({ ...t, [key]: [...(t[key] ?? base), ...added] }));

  const send = (text: string, forcedKey?: string) => {
    const value = text.trim();
    if (!value || typing) return;
    const key = contextKey;
    const base = messages;
    const replies = [
      ...(askName && who ? [{ key: "named", values: { name: chatSafe(who) } }] : []),
      resolveReply(value, forcedKey, restaurant, who),
    ];
    append(key, base, [{ id: newId(), from: "user", text: value }]);
    setTypingKey(key);
    timer.current = setTimeout(() => {
      append(key, base, replies.map((r) => ({ id: newId(), from: "bot" as const, ...r })));
      setTypingKey(null);
    }, REPLY_DELAY_MS);
  };

  const endChat = () => {
    clearTimeout(timer.current);
    setTypingKey(null);
    updateThreads((t) => Object.fromEntries(Object.entries(t).filter(([k]) => k !== contextKey)));
  };

  return { messages, typing, send, endChat, canEnd, restaurant, askName, visitorName, setVisitorName, quickReplies: quickRepliesFor(restaurant) };
}
