// components/order/status-timeline.tsx
import { Check } from "lucide-react";
import { ORDER_STATUS_STEPS, PICKUP_STATUS_STEPS } from "@/types/order";

const LABELS: Record<string, string> = {
  PENDING: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

export function StatusTimeline({ status, orderType }: { status?: string; orderType?: string }) {
  const raw = (status ?? "PENDING").toUpperCase();
  const normalized = raw === "COMPLETED" ? "DELIVERED" : raw;
  const isPickup = orderType === "PICKUP" || orderType === "DINE_IN";
  const steps: readonly string[] = isPickup ? PICKUP_STATUS_STEPS : ORDER_STATUS_STEPS;
  const stepIndex = steps.findIndex((s) => s === normalized);
  const currentIndex = Math.max(stepIndex, 0);
  const isCancelled = normalized === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
        This order was cancelled.
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-[#0F6B5C] text-white" : "bg-neutral-100 text-neutral-300"
                }`}
              >
                {done ? <Check size={13} /> : null}
              </div>
              <span
                className={`text-[10px] font-medium text-center w-16 ${
                  done ? "text-[#17181C]" : "text-neutral-400"
                }`}
              >
                {step === "DELIVERED" && isPickup ? "Picked up" : (LABELS[step] ?? step)}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 -mt-4 ${
                  i < currentIndex ? "bg-[#0F6B5C]" : "bg-neutral-100"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}