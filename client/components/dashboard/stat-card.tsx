// components/dashboard/stat-card.tsx
import type { LucideIcon } from "lucide-react";

type ColorVariant = "amber" | "teal" | "blue" | "purple" | "red";

const variantStyles: Record<ColorVariant, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-100", text: "text-amber-700" },
  teal: { bg: "bg-teal-100", text: "text-teal-700" },
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  purple: { bg: "bg-purple-100", text: "text-purple-700" },
  red: { bg: "bg-red-100", text: "text-red-700" },
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  colorVariant?: ColorVariant;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  colorVariant = "blue" 
}: StatCardProps) {
  const colors = variantStyles[colorVariant];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon size={18} className={colors.text} />
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-900 tabular-nums">
        {value}
      </p>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
          {trend.positive ? "↑" : "↓"} {trend.value} vs yesterday
        </p>
      )}
    </div>
  );
}