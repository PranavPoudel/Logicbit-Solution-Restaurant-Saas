"use client";

// ChatInbox — shared chat list + live reply box.
//
// Used by the owner dashboard (/owner/chats, mode="owner") and the admin panel
// (/admin/chats, mode="admin"). The only differences are which API is called
// and how "my" bubbles are labelled; the backend decides the real sender
// ("owner" / "admin") from the login token, never from the request.
//
// Live updates: React Query refetches every POLL_MS while the tab is visible.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import {
  adminChatsApi,
  ownerChatsApi,
  type ChatInboxApi,
  type ChatSender,
  type ChatSession,
  type ChatThreadMessage,
} from "@/lib/api/chats";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { usePlatformAuthStore } from "@/store/platform-auth-store";

export type ChatInboxMode = "owner" | "admin";

const POLL_MS = 5000;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

// Who is "me" in this inbox? Those bubbles go on the right.
const mySender = (mode: ChatInboxMode): ChatSender => (mode === "admin" ? "admin" : "owner");

function senderLabel(from: ChatSender, mode: ChatInboxMode, visitor: string) {
  if (from === mySender(mode)) return "You";
  if (from === "user") return visitor;
  if (from === "bot") return "Bot";
  return from === "admin" ? "Admin" : "Restaurant";
}

function Bubble({ message, mode, visitor }: { message: ChatThreadMessage; mode: ChatInboxMode; visitor: string }) {
  const mine = message.from === mySender(mode);
  const style = mine
    ? "bg-neutral-900 text-white"
    : message.from === "user"
      ? "border border-neutral-200 bg-white text-neutral-700"
      : message.from === "bot"
        ? "bg-neutral-100 text-neutral-500"
        : "border border-amber-200 bg-amber-50 text-neutral-800"; // the *other* human

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <span className="mb-0.5 px-1 text-[10px] font-semibold text-neutral-400">
        {senderLabel(message.from, mode, visitor)} · {formatDateTime(message.createdAt)}
      </span>
      <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-1.5 text-xs ${style}`}>
        {message.text}
      </div>
    </div>
  );
}

function ChatSessionCard({
  session,
  mode,
  api,
  onSent,
  onEnded,
}: {
  session: ChatSession;
  mode: ChatInboxMode;
  api: ChatInboxApi;
  onSent: (sessionId: string, message: ChatThreadMessage) => void;
  onEnded: (sessionId: string, message: ChatThreadMessage | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const visitor = session.visitorName || session.customer?.name || "Guest";
  const lastMessage = session.messages[session.messages.length - 1];

  // Keep the newest message in view as the thread grows (own send or poll).
  useEffect(() => {
    if (!expanded) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [expanded, session.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      onSent(session.id, await api.reply(session.id, text));
      setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleEnd() {
    if (ending) return;
    setEnding(true);
    setError("");
    try {
      onEnded(session.id, await api.close(session.id));
      setConfirmingEnd(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not end the chat.");
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-neutral-900">{visitor}</p>
          <p className="mt-0.5 text-sm text-neutral-500">
            on <span className="font-medium">{session.restaurant.name}</span>
            {session.customer && <span className="text-neutral-400"> · {session.customer.email}</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="whitespace-nowrap text-xs text-neutral-400">{formatDateTime(session.updatedAt)}</span>
          {session.endedAt ? (
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">Ended</span>
          ) : session.takenOver ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Human replied</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
              <Bot size={10} />
              Bot only
            </span>
          )}
        </div>
      </div>

      {lastMessage && !expanded && (
        <p className="mt-3 truncate text-sm text-neutral-500">
          {senderLabel(lastMessage.from, mode, visitor)}: {lastMessage.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 hover:opacity-70"
      >
        <MessageCircle size={13} />
        {expanded ? "Hide conversation" : `View & reply (${session.messages.length})`}
      </button>

      {expanded && (
        <>
          <div ref={threadRef} className="mt-3 max-h-80 space-y-2.5 overflow-y-auto rounded-lg bg-neutral-50 p-3">
            {session.messages.map((m) => (
              <Bubble key={m.id} message={m} mode={mode} visitor={visitor} />
            ))}
          </div>

          {session.endedAt ? (
            <p className="mt-3 text-xs text-neutral-500">
              This chat ended on {formatDateTime(session.endedAt)}. You can still read it, but replies are turned off.
            </p>
          ) : (
            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
                placeholder={mode === "admin" ? `Reply to ${visitor} as admin…` : `Reply to ${visitor}…`}
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send reply"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </form>
          )}

          {!session.endedAt && (
            <div className="mt-3 flex items-center justify-end gap-2 text-xs">
              {confirmingEnd ? (
                <>
                  <span className="text-neutral-500">End this chat for the visitor?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingEnd(false)}
                    className="rounded-full border border-neutral-200 px-3 py-1 font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleEnd()}
                    disabled={ending}
                    className="rounded-full bg-neutral-900 px-3 py-1 font-semibold text-white disabled:opacity-50"
                  >
                    End chat
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingEnd(true)}
                  className="font-semibold text-neutral-500 hover:text-red-600"
                >
                  End chat
                </button>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          {!session.takenOver && !session.endedAt && (
            <p className="mt-2 text-[11px] text-neutral-400">
              Once you reply, the auto-reply bot stops answering in this chat.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function ChatInbox({ mode }: { mode: ChatInboxMode }) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const api = mode === "admin" ? adminChatsApi : ownerChatsApi;

  // Part of the query key, so a different signed-in account never sees the
  // previous account's cached chats.
  const ownerId = useOwnerAuthStore((s) => s.user?.id);
  const staffId = usePlatformAuthStore((s) => s.staff?.id);
  const accountId = mode === "admin" ? staffId : ownerId;
  const queryKey = ["chat-inbox", mode, accountId];

  const query = useQuery({
    queryKey,
    queryFn: api.list,
    enabled: !!accountId,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false, // pause while the tab is hidden
  });
  const sessions = query.data ?? [];

  const patch = (sessionId: string, change: (s: ChatSession) => ChatSession) =>
    queryClient.setQueryData<ChatSession[]>(queryKey, (prev) => prev?.map((s) => (s.id === sessionId ? change(s) : s)));

  // Show my own reply immediately instead of waiting for the next poll.
  const handleSent = (sessionId: string, message: ChatThreadMessage) =>
    patch(sessionId, (s) => ({
      ...s,
      takenOver: true,
      updatedAt: message.createdAt || s.updatedAt,
      messages: s.messages.some((m) => m.id === message.id) ? s.messages : [...s.messages, message],
    }));

  // Mark a chat ended right away (and show the closing message).
  const handleEnded = (sessionId: string, closing: ChatThreadMessage | null) =>
    patch(sessionId, (s) => ({
      ...s,
      takenOver: true,
      endedAt: closing?.createdAt || new Date().toISOString(),
      messages: closing && !s.messages.some((m) => m.id === closing.id) ? [...s.messages, closing] : s.messages,
    }));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [s.restaurant.name, s.visitorName, s.customer?.name, s.customer?.email].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [sessions, search]);

  const failed = query.isError && !query.data;

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor, email or restaurant…"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {failed && (
        <p className="mt-4 text-sm text-red-600">
          {query.error instanceof Error ? query.error.message : "Could not load chats."}
        </p>
      )}

      {query.isLoading ? (
        <p className="mt-6 text-sm text-neutral-500">Loading chats…</p>
      ) : (
        <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
          {visible.map((session) => (
            <ChatSessionCard key={session.id} session={session} mode={mode} api={api} onSent={handleSent} onEnded={handleEnded} />
          ))}
        </div>
      )}

      {!query.isLoading && !failed && visible.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-semibold text-neutral-900">{sessions.length === 0 ? "No chats yet" : "Nothing matches your search"}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {sessions.length === 0
              ? mode === "admin"
                ? "When a visitor chats with the widget on any restaurant, it'll show up here."
                : "When a visitor chats with the widget on one of your restaurants, it'll show up here."
              : "Try a different search term."}
          </p>
        </div>
      )}
    </>
  );
}
