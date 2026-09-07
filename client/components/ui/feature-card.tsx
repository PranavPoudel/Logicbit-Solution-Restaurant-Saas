// components/ui/feature-card.tsx
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="w-10 h-10 rounded-lg bg-[#1B2333]/5 flex items-center justify-center mb-4">
        <Icon size={20} className="text-[#1B2333]" />
      </div>
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-500 mt-1.5">{description}</p>
    </div>
  );
}