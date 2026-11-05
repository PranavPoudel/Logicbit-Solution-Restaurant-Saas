// components/ui/subscription-lock.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantSubscription } from "@/lib/api/subscriptions";
import { getSubscriptionState, NO_PLAN_PATHS } from "@/lib/utils/subscription";

const MEMBERSHIP_HREF = "/owner/subscriptions";

const copy = {
  none: {
    title: "Membership required",
    body: "The dashboard, orders and menu are open. Pick a plan to unlock the rest.",
    action: "Choose a plan",
  },
  expired: {
    title: "Membership expired",
    body: "Your membership has ended, so the dashboard is locked. Renew to get back in. Your data is safe.",
    action: "Renew membership",
  },
} as const;

export function SubscriptionLock({ children }: { children: React.ReactNode }) {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const pathname = usePathname();

  const { data: sub } = useQuery({
    queryKey: ["subscription-banner", restaurantId],
    queryFn: () => getRestaurantSubscription(restaurantId as string),
    enabled: !!restaurantId,
  });

  const state = getSubscriptionState(sub);
  if ((state !== "none" && state !== "expired") || pathname?.startsWith(MEMBERSHIP_HREF)) return <>{children}</>;
  if (state === "none" && NO_PLAN_PATHS.some((path) => pathname?.startsWith(path))) return <>{children}</>;

  const c = copy[state];

  return (
    <div className="relative h-[calc(100dvh-7rem)] min-h-[28rem] overflow-hidden">
      <div inert aria-hidden="true" className="pointer-events-none select-none blur-sm opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-2">
        <section aria-labelledby="subscription-lock-title" className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#111827]">
            <Lock aria-hidden="true" className="h-5 w-5 text-[#E3A008]" />
          </span>
          <h2 id="subscription-lock-title" className="mt-4 text-lg font-semibold text-neutral-900">
            {c.title}
          </h2>
          <p className="mt-1.5 text-sm text-neutral-600">{c.body}</p>
          <Link
            href={MEMBERSHIP_HREF}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#E3A008] px-4 text-sm font-semibold text-[#17181C] outline-none transition-colors duration-150 hover:bg-[#d49207] focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            {c.action}
          </Link>
        </section>
      </div>
    </div>
  );
}
