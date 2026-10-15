// components/delivery-partners/provider-badge.tsx
import type { ProviderConfig } from "@/lib/delivery-partner-providers";

export function ProviderBadge({ provider, size = 40 }: { provider: ProviderConfig; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
      style={{ width: size, height: size, backgroundColor: provider.color }}
    >
      {provider.initials}
    </span>
  );
}
