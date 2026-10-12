//app/[locale]/(customer)/payment/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMyOrder } from "@/lib/api/orders";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const provider = searchParams.get("provider");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const { data: order, isError, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getMyOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Poll every 3 seconds if not yet PAID
      if (query.state.data?.paymentStatus !== "PAID") return 3000;
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#E3A008]" />
        <h2 className="text-lg font-semibold text-[#17181C]">Verifying Payment...</h2>
        <p className="text-sm text-neutral-500">
          Please wait while we confirm your {provider === "paypay" ? "PayPay" : "payment"} status.
        </p>
        <p className="text-xs text-neutral-400">Order #{orderId}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h2 className="text-lg font-semibold text-[#17181C]">Payment Successful!</h2>
        <p className="text-sm text-neutral-500">Redirecting you to your order tracking page...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-600" />
      <h2 className="text-lg font-semibold text-[#17181C]">Payment Verification Failed</h2>
      <p className="text-sm text-neutral-500">
        We could not verify your payment. Please check your order history or contact support.
      </p>
      <button
        onClick={() => router.push(`/orders/${orderId}`)}
        className="mt-4 rounded-xl bg-[#17181C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2B2D33]"
      >
        View Order History
      </button>
    </div>
  );
}