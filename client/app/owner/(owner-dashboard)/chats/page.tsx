// app/owner/(owner-dashboard)/chats/page.tsx
"use client";

import { ChatInbox } from "@/components/chat-inbox/chat-inbox";

export default function OwnerChatsPage() {
  return (
    <div className="max-w-7xl">
      <h1 className="text-xl font-semibold text-neutral-900">Chats</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Conversations visitors had with the chat widget on your restaurants. Open one to jump in and reply — the
        visitor sees your message in the widget within a few seconds.
      </p>

      <ChatInbox mode="owner" />
    </div>
  );
}
