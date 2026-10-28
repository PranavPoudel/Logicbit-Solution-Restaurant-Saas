// components/owner-email/email-preview.tsx
import { Mail } from "lucide-react";
import { theme } from "@/config/theme";
import type { EmailOrder } from "@/lib/api/owner-emails";
import { formatMoney } from "@/lib/utils/money";
import { formatOrderDate, orderStatus } from "./order-picker";

interface EmailPreviewProps {
  recipient: string;
  subject: string;
  body: string;
  order?: EmailOrder;
}

export function EmailPreview({ recipient, subject, body, order }: EmailPreviewProps) {
  return (
    <section aria-label="Email preview" className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3">
        <Mail size={16} aria-hidden="true" className="text-neutral-400" />
        <h2 className="text-sm font-semibold text-neutral-900">Preview</h2>
        <span className="ml-auto text-xs text-neutral-400">Updates as you type</span>
      </div>

      <div className="space-y-4 bg-neutral-50 p-4">
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <dl className="space-y-1 border-b border-neutral-100 pb-3 text-xs">
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-neutral-400">To</dt>
              <dd className="min-w-0 truncate text-neutral-700">{recipient}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-neutral-400">Subject</dt>
              <dd className={`min-w-0 break-words font-semibold ${subject ? "text-neutral-900" : "text-neutral-400"}`}>
                {subject || "Your subject line"}
              </dd>
            </div>
          </dl>

          <p
            className={`whitespace-pre-wrap break-words pt-1 text-sm leading-relaxed ${
              body ? "text-neutral-700" : "text-neutral-400"
            }`}
          >
            {body || "Your message will appear here."}
          </p>

          {order && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-900">Order {order.number}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${orderStatus[order.status].className}`}>
                  {orderStatus[order.status].label}
                </span>
              </div>
              <p className="mt-1 text-neutral-600">{order.items}</p>
              <p className="mt-1 flex justify-between text-neutral-500">
                <span>{formatOrderDate(order.placedAt)}</span>
                <span className="font-medium tabular-nums text-neutral-900">{formatMoney(order.total)}</span>
              </p>
            </div>
          )}

          <p className="border-t border-neutral-100 pt-3 text-[11px] leading-snug text-neutral-400">
            You&apos;re getting this because you ordered through {theme.brand.name}. Unsubscribe
          </p>
        </div>
      </div>
    </section>
  );
}
