import { isAxiosError } from "axios";

export function getErrorMessage(
  err: unknown,
  fallback: string,
  options: { includeErrorMessage?: boolean } = {}
): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message) && message.length > 0) return message.join(", ");
    if (typeof message === "string" && message) return message;
  }
  if (options.includeErrorMessage && err instanceof Error && err.message) return err.message;
  return fallback;
}
