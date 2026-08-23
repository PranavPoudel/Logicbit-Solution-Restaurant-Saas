// components/auth/owner-auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnerAuthStore } from "@/store/owner-auth-store";

export function OwnerAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useOwnerAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-mount pattern to avoid hydration mismatch, no external system to subscribe to
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/owner/login");
    }
  }, [mounted, isAuthenticated, router]);

  // Avoid a flash of dashboard content before the persisted auth state
  // has hydrated from localStorage on the client.
  if (!mounted || !isAuthenticated) return null;

  return <>{children}</>;
}
