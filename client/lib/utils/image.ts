// lib/utils/image.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3700';

export function getFullImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  return `${BACKEND_URL}${path}`; // Prepend backend URL
}