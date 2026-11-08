import { isAxiosError } from "axios";

/** Pulls the HTTP status and the API's error code (for example EMAIL_NOT_VERIFIED) out of a failed request. */
export function authErrorInfo(error: unknown): { status?: number; code?: string; message?: string } {
  if (!isAxiosError(error)) return {};
  const data = error.response?.data as { error?: string; message?: unknown } | undefined;
  return {
    status: error.response?.status,
    code: data?.error,
    message: typeof data?.message === "string" ? data.message : undefined,
  };
}
