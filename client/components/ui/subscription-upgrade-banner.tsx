"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantSubscription } from "@/lib/api/subscriptions";

export function SubscriptionUpgradeBanner() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const { data: sub } = useQuery({
    queryKey: ["subscription-banner", restaurantId],
    queryFn: () => getRestaurantSubscription(restaurantId as string),
    enabled: !!restaurantId,
  });

  const hasNoSubscription = sub?.status === "NO_SUBSCRIPTION";
  const isExpiring = sub?.status === "expiring";

  // Don't render anything if they have an active subscription
  if (!hasNoSubscription && !isExpiring) return null;

  if (hasNoSubscription) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Subscription Required</p>
            <p className="text-xs text-red-600 mt-0.5">
              Upgrade your plan to access this feature and manage your restaurant.
            </p>
          </div>
        </div>
        <Link
          href="/subscriptions"
          className="w-full sm:w-auto px-4 py-2 bg-[#E3A008] hover:bg-[#d49207] text-[#17181C] text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  if (isExpiring) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-700">Subscription Expiring Soon</p>
            <p className="text-xs text-yellow-600 mt-0.5">
              Your plan is expiring. Renew now to avoid service interruption.
            </p>
          </div>
        </div>
        <Link
          href="/subscriptions"
          className="w-full sm:w-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap"
        >
          Renew Now
        </Link>
      </div>
    );
  }

  return null;
}