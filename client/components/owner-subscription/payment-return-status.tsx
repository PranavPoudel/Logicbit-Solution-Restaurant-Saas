// components/owner-subscription/payment-return-status.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { subscriptionPaymentsApi } from "@/lib/api/subscription-payments";

const POLL_MS = 2000;
const GIVE_UP_MS = 60_000;

/** The gateway sends the owner back with ?paymentId=...; the real result arrives by webhook, so wait for it here. */
export function PaymentReturnStatus({ restaurantId }: { restaurantId: string }) {
  const paymentId = useSearchParams().get("paymentId");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [gaveUp, setGaveUp] = useState(false);

  const { data } = useQuery({
    queryKey: ["subscription-payments", restaurantId],
    queryFn: () => subscriptionPaymentsApi.history(restaurantId),
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const payment = query.state.data?.find((p) => p.id === paymentId);
      return payment && payment.status !== "PENDING" ? false : gaveUp ? false : POLL_MS;
    },
  });

  const status = data?.find((p) => p.id === paymentId)?.status;

  useEffect(() => {
    if (!paymentId) return;
    const id = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(id);
  }, [paymentId]);

  useEffect(() => {
    if (status === "PAID") queryClient.invalidateQueries();
  }, [status, queryClient]);

  if (!paymentId || !status) return null;

  const dismiss = () => router.replace(pathname);

  if (status === "PENDING") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Loader2 size={20} aria-hidden="true" className={`mt-0.5 shrink-0 text-blue-600 ${gaveUp ? "" : "animate-spin motion-reduce:animate-none"}`} />
        <div>
          <p className="text-sm font-semibold text-blue-900">{gaveUp ? "Still waiting for confirmation" : "Confirming your payment…"}</p>
          <p className="text-xs text-blue-800">
            {gaveUp
              ? "Your bank or wallet hasn't confirmed yet. You can leave this page; your plan updates here as soon as the payment is confirmed."
              : "This usually takes a few seconds. Please keep this page open."}
          </p>
        </div>
      </div>
    );
  }

  const paid = status === "PAID";
  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 ${paid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
      {paid ? <CheckCircle2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-green-600" /> : <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${paid ? "text-green-900" : "text-red-900"}`}>{paid ? "Payment received" : "Payment didn't go through"}</p>
        <p className={`text-xs ${paid ? "text-green-800" : "text-red-800"}`}>
          {paid ? "Your plan is active." : "Please try again, or contact support if the problem continues."}
        </p>
      </div>
      <button type="button" onClick={dismiss} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-neutral-700 hover:bg-white/60 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008]">
        Dismiss
      </button>
    </div>
  );
}
