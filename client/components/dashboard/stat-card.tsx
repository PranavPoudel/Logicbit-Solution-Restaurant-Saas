// components/dashboard/stat-card.tsx
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-neutral-500">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#1B2333]/5 flex items-center justify-center">
          <Icon size={16} className="text-[#1B2333]" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-neutral-900 tabular-nums">
        {value}
      </p>
      {trend && (
        <p
          className={`text-xs mt-1 ${
            trend.positive ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {trend.positive ? "↑" : "↓"} {trend.value} vs yesterday
        </p>
      )}
    </div>
  );
}
