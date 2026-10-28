import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useChatContextStore } from "@/store/chat-context-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { quickRepliesFor, resolveReply } from "@/lib/utils/chat-replies";
import { chatSafe } from "@/lib/utils/chat-text";
import { askGeneralChat, endChatSession, fetchChatThread, sendChatMessage, startChat } from "@/lib/api/chats";

// Bot lines from the canned replies carry a translation `key`; lines from the
// server (bot, owner, admin) carry plain `text`.
export type ChatMessage = { id: string; from: "bot" | "user" | "owner" | "admin"; key?: string; values?: Record<string, string>; text?: string; href?: string; action?: string };

// Server-side chat session for one conversation (restaurant chats only).
type SessionMeta = { id: string; takenOver: boolean; ended: boolean };

const MAX_THREADS = 8;
const MAX_MESSAGES = 40;
const REPLY_DELAY_MS = 900; // minimum "typing" time so replies don't feel instant
const POLL_MS = 4000;
const NEARBY_WORDS = /near|close|closest|nearest|around|近/i;

// Small localStorage-backed store usable with useSyncExternalStore.
function createStore<T>(storageKey: string, normalize: (value: T) => T) {
  const EMPTY: Record<string, T> = {};
  const listeners = new Set<() => void>();
  let cache: Record<string, T> | null = null;

  const read = (): Record<string, T> => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, T>) : {};
    } catch {
      return {};
    }
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    getSnapshot: () => (cache ??= read()),
    getServerSnapshot: () => EMPTY,
    update(change: (all: Record<string, T>) => Record<string, T>) {
      const kept = Object.entries(change((cache ??= read()))).slice(-MAX_THREADS).map(([k, v]) => [k, normalize(v)] as const);
      cache = Object.fromEntries(kept);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(cache));
      } catch {
        // Storage blocked (private mode): the chat just won't resume.
      }
      listeners.forEach((l) => l());
    },
  };
}

const threadStore = createStore<ChatMessage[]>("chat-threads", (m) => m.slice(-MAX_MESSAGES));
const sessionStore = createStore<SessionMeta>("chat-sessions", (s) => s);

let counter = 0;
const newId = () => `${Date.now()}-${counter++}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const greeting = (name?: string): ChatMessage[] => [
  name ? { id: "g0", from: "bot", key: "greetingRestaurant", values: { name: chatSafe(name) } } : { id: "g0", from: "bot", key: "greeting" },
  { id: "g1", from: "bot", key: "help" },
];

const withoutKey = <T,>(all: Record<string, T>, key: string) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== key));

function setSession(key: string, meta: SessionMeta | null) {
  sessionStore.update((all) => (meta ? { ...all, [key]: meta } : withoutKey(all, key)));
}

function httpError(err: unknown) {
  const response = (err as { response?: { status?: number; data?: { message?: unknown } } })?.response;
  return { status: response?.status, message: String(response?.data?.message ?? "") };
}

// Browser location, asked for ONLY when the visitor asks about "nearest/closest".
function locate(text: string): Promise<{ latitude?: number; longitude?: number }> {
  if (!NEARBY_WORDS.test(text) || typeof navigator === "undefined" || !("geolocation" in navigator)) return Promise.resolve({});
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: Math.round(p.coords.latitude * 1000) / 1000, longitude: Math.round(p.coords.longitude * 1000) / 1000 }),
      () => resolve({}),
      { timeout: 5000, maximumAge: 300000 },
    ),
  );
}

/** `active` = the widget is open; only then do we poll for owner/admin replies. */
export function useChatbot(active = false) {
  const restaurant = useChatContextStore((s) => s.restaurant);
  const customer = useCustomerAuthStore((s) => s.customer);
  const threads = useSyncExternalStore(threadStore.subscribe, threadStore.getSnapshot, threadStore.getServerSnapshot);
  const sessions = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
  const contextKey = `${customer?.id ?? "guest"}:${restaurant?.id ?? "general"}`;
  const session = sessions[contextKey];

  const [typingKey, setTypingKey] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const restaurantName = useRef(restaurant?.name);
  restaurantName.current = restaurant?.name;

  const messages = threads[contextKey] ?? greeting(restaurant?.name);
  const typing = typingKey === contextKey;
  const ended = !!session?.ended;
  const takenOver = !!session?.takenOver;
  const canEnd = messages.some((m) => m.from === "user");
  const askName = !!restaurant && !customer && !canEnd && !typing;
  const who = customer?.name ?? visitorName.trim();

  const append = (key: string, base: ChatMessage[], added: ChatMessage[]) =>
    threadStore.update((t) => ({ ...t, [key]: [...(t[key] ?? base), ...added] }));

  // While open: pick up replies a restaurant owner / admin wrote, and notice
  // when the chat was ended from their side.
  const sessionId = session?.id;
  const sessionDone = session?.ended;
  useEffect(() => {
    if (!active || !sessionId || sessionDone) return;
    let stopped = false;
    const key = contextKey;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const thread = await fetchChatThread(sessionId);
        if (stopped) return;
        const humans = thread.messages.filter((m) => m.from === "owner" || m.from === "admin");
        threadStore.update((t) => {
          const current = t[key] ?? greeting(restaurantName.current);
          const known = new Set(current.map((m) => m.id));
          const fresh: ChatMessage[] = humans.filter((m) => !known.has(m.id)).map((m) => ({ id: m.id, from: m.from as "owner" | "admin", text: m.text }));
          return fresh.length ? { ...t, [key]: [...current, ...fresh] } : t;
        });
        const latest = sessionStore.getSnapshot()[key];
        if (latest && (latest.takenOver !== thread.takenOver || latest.ended !== thread.ended)) {
          setSession(key, { ...latest, takenOver: thread.takenOver, ended: thread.ended });
        }
      } catch (err) {
        if (httpError(err).status === 404) setSession(key, null); // session is gone: forget it
      }
    };

    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [active, sessionId, sessionDone, contextKey]);

  const send = async (text: string, forcedKey?: string) => {
    const value = text.trim();
    if (!value || typing || ended) return;
    const key = contextKey;
    const base = messages;
    const named = askName && who ? [{ key: "named", values: { name: chatSafe(who) } }] : [];

    // A human is already in this chat: just deliver the message, no bot, no typing.
    const humanHere = !!restaurant && takenOver;
    append(key, base, [{ id: newId(), from: "user", text: value }]);
    if (!humanHere) setTypingKey(key);
    const startedAt = Date.now();

    let serverReply: { id: string; text: string } | null = null;
    let useCanned = true; // fall back to the built-in answers unless the server handled it

    try {
      if (restaurant) {
        let meta = sessionStore.getSnapshot()[key];
        if (!meta) {
          const created = await startChat(restaurant.id, who || undefined);
          meta = { id: created.id, takenOver: false, ended: false };
          setSession(key, meta);
        }
        const result = await sendChatMessage(meta.id, value);
        if (result.takenOver && !meta.takenOver) setSession(key, { ...meta, takenOver: true });
        if (result.reply) {
          serverReply = result.reply;
          useCanned = false;
        } else if (result.takenOver) {
          useCanned = false; // a human will answer
        }
      } else if (!forcedKey) {
        // Typed question with no restaurant open: platform-wide assistant. Quick-reply
        // chips keep their fixed built-in answers.
        const coords = await locate(value);
        const history = base.filter((m) => m.text).slice(-8).map((m) => ({ from: m.from === "user" ? "user" : "bot", text: m.text as string }));
        const reply = await askGeneralChat({ message: value, history, ...coords });
        if (reply) {
          serverReply = { id: newId(), text: reply };
          useCanned = false;
        }
      }
    } catch (err) {
      const { status, message } = httpError(err);
      if (status === 404) setSession(key, null);
      else if (status === 400 && /ended|full/i.test(message)) {
        const meta = sessionStore.getSnapshot()[key];
        if (meta) setSession(key, { ...meta, ended: true });
        useCanned = false;
      }
      // anything else (network, 429, 500): use the built-in answer below
    }

    if (!humanHere) {
      const wait = REPLY_DELAY_MS - (Date.now() - startedAt);
      if (wait > 0) await sleep(wait);
    }

    const added: ChatMessage[] = [];
    if (serverReply || useCanned) added.push(...named.map((r) => ({ id: newId(), from: "bot" as const, ...r })));
    if (serverReply) added.push({ id: serverReply.id, from: "bot", text: serverReply.text });
    else if (useCanned) added.push({ id: newId(), from: "bot", ...resolveReply(value, forcedKey, restaurant, who) });
    if (added.length) append(key, base, added);
    setTypingKey(null);
  };

  // Ends the chat (best effort on the server) and starts over locally.
  const endChat = () => {
    setTypingKey(null);
    if (session && !session.ended) void endChatSession(session.id).catch(() => undefined);
    threadStore.update((t) => withoutKey(t, contextKey));
    sessionStore.update((s) => withoutKey(s, contextKey));
  };

  return {
    messages,
    typing,
    send,
    endChat,
    canEnd,
    ended,
    takenOver,
    restaurant,
    askName,
    visitorName,
    setVisitorName,
    quickReplies: takenOver || ended ? [] : quickRepliesFor(restaurant),
  };
}
