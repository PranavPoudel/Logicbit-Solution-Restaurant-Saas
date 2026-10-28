// app/admin/chats/page.tsx
"use client";

import { ChatInbox } from "@/components/chat-inbox/chat-inbox";

export default function AdminChatsPage() {
  return (
    <div className="max-w-7xl">
      <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
      <p className="mt-1 text-sm text-gray-500">
        All visitor conversations across every restaurant. Open one to read the thread and reply as admin — the
        restaurant owner can see your messages too.
      </p>

      <ChatInbox mode="admin" />
    </div>
  );
}
