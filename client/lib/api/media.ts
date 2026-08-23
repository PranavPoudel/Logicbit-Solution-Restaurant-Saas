// lib/api/media.ts — Module 19: Media (Image Upload) — Owner
import { ownerApiClient } from "@/lib/api/owner-client";
import { API_BASE_URL } from "@/lib/api/create-api-client";

export interface UploadedMedia {
  id?: string;
  url?: string;
}

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return API_ORIGIN + url;
}

export async function uploadMedia(file: File, restaurantId: string): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("restaurantId", restaurantId);

  const { data } = await ownerApiClient.post("/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[media/upload] unwrapped payload:", data);
  }
  return { ...data, url: resolveMediaUrl(data?.url) };
}

export async function deleteMedia(id: string) {
  const { data } = await ownerApiClient.delete(`/media/${id}`);
  return data;
}