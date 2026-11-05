// components/ui/subscription-upgrade-banner.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantSubscription } from "@/lib/api/subscriptions";
import { getSubscriptionState, NO_PLAN_PATHS } from "@/lib/utils/subscription";

const MEMBERSHIP_HREF = "/owner/subscriptions";

const copy = {
  none: {
    title: "No active membership",
    body: "Your restaurant has no membership yet. Pick a plan to unlock the full dashboard.",
    action: "Choose a plan",
    box: "bg-red-50 border-red-200",
    icon: "text-red-600",
    heading: "text-red-700",
    text: "text-red-600",
    button: "bg-[#E3A008] hover:bg-[#d49207] text-[#17181C]",
  },
  expiring: {
    title: "Membership expiring soon",
    body: "Your membership ends soon. Renew it to avoid any interruption.",
    action: "Renew membership",
    box: "bg-yellow-50 border-yellow-200",
    icon: "text-yellow-600",
    heading: "text-yellow-700",
    text: "text-yellow-600",
    button: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
} as const;

export function SubscriptionUpgradeBanner() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const pathname = usePathname();

  const { data: sub } = useQuery({
    queryKey: ["subscription-banner", restaurantId],
    queryFn: () => getRestaurantSubscription(restaurantId as string),
    enabled: !!restaurantId,
  });

  const state = getSubscriptionState(sub);
  if (pathname?.startsWith(MEMBERSHIP_HREF)) return null;
  if (state !== "none" && state !== "expiring") return null;
  if (state === "none" && !NO_PLAN_PATHS.some((path) => pathname?.startsWith(path))) return null; // the lock card says it there

  const c = copy[state];

  return (
    <div role="status" className={`${c.box} border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className={`w-5 h-5 ${c.icon} mt-0.5 shrink-0`} />
        <div>
          <p className={`text-sm font-medium ${c.heading}`}>{c.title}</p>
          <p className={`text-xs ${c.text} mt-0.5`}>{c.body}</p>
        </div>
      </div>
      <Link
        href={MEMBERSHIP_HREF}
        className={`w-full sm:w-auto min-h-11 inline-flex items-center justify-center px-4 py-2 ${c.button} text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap`}
      >
        {c.action}
      </Link>
    </div>
  );
}
