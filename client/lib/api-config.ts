const DEFAULT_API_URL = "http://localhost:3005/api/v1";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");
