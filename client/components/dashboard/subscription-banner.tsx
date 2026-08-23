// components/dashboard/subscription-banner.tsx
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { RestaurantSubscription } from "@/types/owner";

export function SubscriptionBanner({
  subscription,
}: {
  subscription: RestaurantSubscription;
}) {
  if (subscription.status === "active" && subscription.daysRemaining > 15) {
    return null; // healthy subscription — no need to take up space
  }

  const isExpired = subscription.status === "expired";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
        isExpired
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}
    >
      <AlertTriangle size={18} className="shrink-0" />
      <p className="text-sm flex-1">
        {isExpired
          ? `Your ${subscription.planName} plan has expired.`
          : `Your ${subscription.planName} plan expires in ${subscription.daysRemaining} days.`}
      </p>
      <Link
        href="/settings"
        className="text-sm font-medium underline underline-offset-2 shrink-0"
      >
        Renew now
      </Link>
    </div>
  );
}
