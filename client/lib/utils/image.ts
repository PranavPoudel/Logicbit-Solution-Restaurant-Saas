// lib/utils/image.ts
import { API_ORIGIN } from "@/lib/api-config";

export const getItemImage = (item: { imageUrl?: string; image?: string }) => item.imageUrl || item.image;

export function getFullImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  if (path.startsWith("/images/")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
