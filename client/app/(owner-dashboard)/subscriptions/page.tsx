"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, CreditCard, Calendar, RefreshCw, Mail } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantSubscription, setSubscriptionAutoRenew } from "@/lib/api/subscriptions";

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  
  // Local state for optimistic UI updates on the toggle
  const [autoRenewLocal, setAutoRenewLocal] = useState<boolean>(false);

  const { data: subscription, isLoading, isError } = useQuery({
    queryKey: ["subscription", restaurantId],
    queryFn: () => getRestaurantSubscription(restaurantId as string),
    enabled: !!restaurantId,
  });

  // Sync local toggle state with fetched data
  useEffect(() => {
    if (subscription?.autoRenew !== undefined) {
      setAutoRenewLocal(subscription.autoRenew);
    }
  }, [subscription]);

  const toggleMutation = useMutation({
    mutationFn: (enable: boolean) => setSubscriptionAutoRenew(restaurantId as string, enable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", restaurantId] });
    },
  });

  const handleToggle = () => {
    const newValue = !autoRenewLocal;
    setAutoRenewLocal(newValue); // Optimistic update
    
    // ✅ Senior-level fix: Revert UI if the backend call fails
    toggleMutation.mutate(newValue, {
      onError: () => {
        setAutoRenewLocal(!newValue); // Snap back to original state
      }
    });
  };

  if (!restaurantId) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-400 py-12 text-center">Loading subscription details…</p>;
  }

  // Handle NO_SUBSCRIPTION state explicitly
  if (isError || subscription?.status === "NO_SUBSCRIPTION") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Subscription</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your restaurant's subscription plan and billing.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-red-700">No Active Subscription</h2>
            <p className="text-sm text-red-600 mt-1">
              {subscription?.message || "Your restaurant doesn't have an active subscription."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <button
              onClick={() => alert("Upgrade flow (Payment Gateway) coming in Phase 4! For now, please contact support.")}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#E3A008] text-[#17181C] font-bold rounded-lg hover:bg-[#d49207] transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              Upgrade to Pro Plan
            </button>
            <a
              href="mailto:support@logicbit.com"
              className="w-full sm:w-auto px-6 py-2.5 bg-white border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isExpiring = subscription?.status === "expiring";
  const isExpired = subscription?.status === "expired";
  const isTrial = subscription?.status === "trial";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Subscription</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your restaurant's subscription plan and billing.
        </p>
      </div>

      {/* Subscription Status Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        {/* Plan Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-neutral-900">
                {subscription?.planName || "Standard Plan"}
              </h2>
              {isTrial && (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full">
                  Trial
                </span>
              )}
              {isExpiring && (
                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase rounded-full">
                  Expiring Soon
                </span>
              )}
              {subscription?.status === "active" && (
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {isTrial
                ? "You're on a trial period."
                : isExpiring
                ? "Your subscription is expiring soon."
                : isExpired
                ? "Your subscription has expired."
                : "Your subscription is currently active."}
            </p>
          </div>
          <CreditCard size={32} className="text-[#E3A008]" />
        </div>

        {/* Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
          {subscription?.startDate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Calendar size={18} className="text-neutral-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Start Date</p>
                <p className="text-sm font-medium text-neutral-900">
                  {new Date(subscription.startDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}

          {subscription?.expiryDate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Calendar size={18} className="text-neutral-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Expiry Date</p>
                <p className={`text-sm font-medium ${isExpiring ? "text-red-600" : "text-neutral-900"}`}>
                  {new Date(subscription.expiryDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ✅ PERFECTED Auto-Renew Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F6B5C]/10 flex items-center justify-center">
              <RefreshCw size={18} className="text-[#0F6B5C]" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Auto-Renew</p>
              <p className="text-xs text-neutral-500">
                {autoRenewLocal
                  ? "Your subscription will renew automatically."
                  : "Manual renewal required."}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            role="switch"
            aria-checked={autoRenewLocal}
            onClick={handleToggle}
            disabled={toggleMutation.isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0F6B5C] focus:ring-offset-2 ${
              autoRenewLocal ? 'bg-[#0F6B5C]' : 'bg-neutral-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoRenewLocal ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Warning Banners */}
        {isExpiring && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700">Subscription Expiring Soon</p>
              <p className="text-xs text-yellow-600 mt-1">
                Your subscription will expire on{" "}
                {subscription.expiryDate &&
                  new Date(subscription.expiryDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                . Please contact support to renew your plan.
              </p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Subscription Expired</p>
              <p className="text-xs text-red-600 mt-1">
                Your subscription has expired. Please contact support to renew your plan and
                restore access to premium features.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Your Plan Includes</h3>
        <ul className="space-y-3">
          {[
            "Unlimited menu items and categories",
            "Advanced analytics and reporting",
            "Custom storefront builder",
            "Promotional popups and banners",
            "Customer review management",
            "Priority customer support",
          ].map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#0F6B5C] shrink-0" />
              <span className="text-sm text-neutral-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}