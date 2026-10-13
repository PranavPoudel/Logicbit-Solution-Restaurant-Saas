// components/account/account-row.tsx
import Link from "next/link";

interface AccountRowProps {
  href: string;
  title: string;
  subtitle: string;
  amount: number;
  badge: { label: string; style: string };
  index: number;
}

export function AccountRow({ href, title, subtitle, amount, badge, index }: AccountRowProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="animate-fade-up flex items-center justify-between gap-3 rounded-xl border border-[#E8E7E2] bg-white p-4 transition-colors hover:border-neutral-300 md:p-5"
    >
      <div className="min-w-0">
        <p className="truncate text-base font-medium text-[#17181C]">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-base text-[#17181C]">Rs {amount}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.style}`}>
          {badge.label}
        </span>
      </div>
    </Link>
  );
}
