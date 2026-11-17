import { apiClient } from "@/lib/api/client";
import { ownerApiClient } from "@/lib/api/owner-client";
import { platformApiClient } from "@/lib/api/platform-client";

export type ChatSender = "user" | "bot" | "owner" | "admin";

export interface ChatThreadMessage {
  id: string;
  from: ChatSender;
  text: string;
  createdAt: string;
}

export interface SendChatResult {
  takenOver: boolean;
  reply: { id: string; text: string; followUps?: string[] } | null;
}

export interface ChatThread {
  takenOver: boolean;
  ended: boolean;
  messages: ChatThreadMessage[];
}

export async function startChat(restaurantId: string, visitorName?: string) {
  const { data } = await apiClient.post<{ id: string }>("/chats", {
    restaurantId,
    ...(visitorName ? { visitorName } : {}),
  });
  return data;
}

export async function sendChatMessage(sessionId: string, text: string) {
  const { data } = await apiClient.post<SendChatResult>(`/chats/${sessionId}/messages`, { text });
  return data;
}

export async function fetchChatThread(sessionId: string) {
  const { data } = await apiClient.get<ChatThread>(`/chats/${sessionId}/messages`);
  return data;
}

export async function endChatSession(sessionId: string) {
  await apiClient.post(`/chats/${sessionId}/end`);
}

export async function askGeneralChat(input: {
  message: string;
  history: { from: string; text: string }[];
  latitude?: number;
  longitude?: number;
}) {
  const { data } = await apiClient.post<{ reply: string | null }>("/chats/general", input);
  return data.reply;
}

export interface ChatSession {
  id: string;
  visitorName: string | null;
  takenOver: boolean;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant: { id: string; name: string; slug: string };
  customer: { id: string; name: string; email: string } | null;
  messages: ChatThreadMessage[];
}

export interface ChatInboxApi {
  list: () => Promise<ChatSession[]>;
  reply: (sessionId: string, text: string) => Promise<ChatThreadMessage>;
  close: (sessionId: string) => Promise<ChatThreadMessage | null>;
}

type Client = typeof ownerApiClient;

function inboxApi(client: Client, listPath: string, basePath: string): ChatInboxApi {
  return {
    list: async () => (await client.get<ChatSession[]>(listPath)).data,
    reply: async (sessionId, text) => (await client.post<ChatThreadMessage>(`${basePath}/${sessionId}/reply`, { text })).data,
    close: async (sessionId) => (await client.post<{ ended: boolean; message: ChatThreadMessage | null }>(`${basePath}/${sessionId}/close`)).data.message,
  };
}

export const ownerChatsApi = inboxApi(ownerApiClient, "/chats/received", "/chats");
export const adminChatsApi = inboxApi(platformApiClient, "/platform-admin/chats", "/platform-admin/chats");