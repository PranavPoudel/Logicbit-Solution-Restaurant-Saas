// components/account/account-row.tsx
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/utils/money";

interface AccountRowProps {
  href: string;
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  badge: { label: string; tone: "ink" | "herb" | "chili" | "saffron" | "soft" };
  index: number;
}

export function AccountRow({ href, title, subtitle, amount, currency, badge, index }: AccountRowProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="animate-fade-up flex items-center justify-between gap-3 rounded-[24px] bg-paper p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm md:p-5"
    >
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-extrabold">{title}</p>
        <p className="mt-0.5 text-ink/70">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="font-display text-2xl font-extrabold">{formatMoney(amount, currency)}</p>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
    </Link>
  );
}
