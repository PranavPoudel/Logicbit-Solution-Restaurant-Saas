//app/[locale]/(customer)/payment/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMyOrder, payOrderNow } from "@/lib/api/orders";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const provider = searchParams.get("provider");
  const cancelled = searchParams.get("cancelled") === "1";
  const providerName = provider === "paypay" ? "PayPay" : provider === "stripe" ? "card" : "payment";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const retryPayment = async () => {
    setRetrying(true);
    setRetryFailed(false);
    try {
      const result = await payOrderNow(orderId as string);
      if (result.redirectUrl && !result.paid) {
        window.location.href = result.redirectUrl;
        return;
      }
      router.push(`/orders/${orderId}`);
    } catch {
      setRetryFailed(true);
      setRetrying(false);
    }
  };

  const { data: order, isError, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getMyOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Poll every 3 seconds if not yet PAID (but not after the customer backed out of the payment page)
      if (!cancelled && query.state.data?.paymentStatus !== "PAID") return 3000;
      return false;
    },
  });

  useEffect(() => {
    if (isLoading) return;

    if (isError || !order) {
      setStatus("error");
      return;
    }

    if (order.paymentStatus === "PAID") {
      setStatus("success");
      // Redirect to order tracking page after a brief success message
      const timer = setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [order, isLoading, isError, orderId, router]);

  // The customer closed the payment page without paying; the order stays unpaid and the restaurant never sees it.
  if (cancelled && order && order.paymentStatus !== "PAID") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-amber-600" />
        <h2 className="text-lg font-semibold text-brand-ink">Payment cancelled</h2>
        <p className="text-sm text-neutral-500">You were not charged. Your order has not been sent to the restaurant.</p>
        {retryFailed && <p role="alert" className="text-sm font-medium text-red-600">We could not open the payment page. Please try again.</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={retryPayment}
            disabled={retrying}
            className="rounded-xl bg-brand-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-ink-hover disabled:opacity-50"
          >
            {retrying ? "Opening payment..." : "Try again"}
          </button>
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            disabled={retrying}
            className="rounded-xl border border-neutral-300 bg-white px-6 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            View order
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-gold" />
        <h2 className="text-lg font-semibold text-brand-ink">Verifying Payment...</h2>
        <p className="text-sm text-neutral-500">
          Please wait while we confirm your {providerName} status.
        </p>
        <p className="text-xs text-neutral-400">Order #{orderId}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h2 className="text-lg font-semibold text-brand-ink">Payment Successful!</h2>
        <p className="text-sm text-neutral-500">Redirecting you to your order tracking page...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-600" />
      <h2 className="text-lg font-semibold text-brand-ink">Payment Verification Failed</h2>
      <p className="text-sm text-neutral-500">
        We could not verify your payment. Please check your order history or contact support.
      </p>
      <button
        onClick={() => router.push(`/orders/${orderId}`)}
        className="mt-4 rounded-xl bg-brand-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-ink-hover"
      >
        View Order History
      </button>
    </div>
  );
}