   "use client";
 // components/ui/pricing-card.tsx
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: (planId: string) => void;
}

export function PricingCard({ plan, onSelect }: PricingCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-6 flex flex-col ${
        plan.isPopular
          ? "border-2 border-[#1B2333] shadow-md"
          : "border border-neutral-200"
      }`}
    >
      {plan.isPopular && (
        <span className="self-start text-xs font-medium bg-[#1B2333] text-white px-2 py-1 rounded mb-3">
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>
      <p className="text-3xl font-bold text-neutral-900 mt-2">
        Rs. {plan.price}
        <span className="text-sm font-normal text-neutral-500">/mo</span>
      </p>
      <ul className="mt-4 space-y-2 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="text-sm text-neutral-600 flex items-center gap-2">
            <span className="text-emerald-600">✓</span> {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(plan.id)}
        className="mt-6 w-full bg-[#1B2333] text-white rounded-lg py-2.5 font-medium hover:opacity-90 transition"
      >
        Choose Plan
      </button>
    </div>
  );
}