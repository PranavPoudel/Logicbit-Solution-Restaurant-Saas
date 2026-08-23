// lib/api/platform-auth.ts — Module 4: Platform Staff Auth
import { platformApiClient } from "@/lib/api/platform-client";

// TODO: confirm exact response field names via Swagger.
export interface PlatformLoginInput {
  email: string;
  password: string;
}

export async function platformLogin(input: PlatformLoginInput) {
  const { data } = await platformApiClient.post("/platform-auth/login", input);
  return data;
}
