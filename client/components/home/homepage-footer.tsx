 // components/home/homepage-footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { getRestaurantThemeStyle } from "@/lib/utils/restaurant-theme";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, Camera, Globe } from "lucide-react";
import { theme } from "@/config/theme";
import { RestaurantFooter } from "@/components/menu/restaurant-footer";
import { getRestaurantByIdOrSlug } from "@/lib/api/discovery";

export function HomepageFooter() {
  return (
    <footer style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }} className="mt-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12 grid sm:grid-cols-4 gap-8">
        <div>
          <h3 className="font-serif text-xl mb-2">{theme.brand.name}</h3>
          <p className="text-sm" style={{ color: `${theme.colors.background}8C` }}>
            {theme.content.siteTagline}
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide mb-3" style={{ color: `${theme.colors.background}66` }}>
            Company
          </h4>
          <div className="space-y-2 text-sm" style={{ color: `${theme.colors.background}B3` }}>
            <Link href="/for-restaurants" className="block hover:opacity-100" style={{ opacity: 0.9 }}>
              For Restaurants
            </Link>
            <Link href="/about" className="block hover:opacity-100" style={{ opacity: 0.9 }}>
              About Us
            </Link>
            <Link href="/careers" className="block hover:opacity-100" style={{ opacity: 0.9 }}>
              Careers
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide mb-3" style={{ color: `${theme.colors.background}66` }}>
            Support
          </h4>
          <div className="space-y-2 text-sm" style={{ color: `${theme.colors.background}B3` }}>
            <Link href="/help" className="block hover:opacity-100" style={{ opacity: 0.9 }}>
              Help Center
            </Link>
            <Link href="/terms" className="block hover:opacity-100" style={{ opacity: 0.9 }}>
              Terms of Service
            </Link>
            <Link href="/privacy" className="block hover:opacity-100" style={{ opacity: 0.9 }}>
              Privacy Policy
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide mb-3" style={{ color: `${theme.colors.background}66` }}>
            Contact
          </h4>
          <div className="space-y-2 text-sm" style={{ color: `${theme.colors.background}B3` }}>
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: theme.colors.primary }} />
              <span>{theme.content.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: theme.colors.primary }} />
              <span>{theme.content.contactEmail}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Globe size={18} className="cursor-pointer" style={{ color: `${theme.colors.background}80` }} />
              <Camera size={18} className="cursor-pointer" style={{ color: `${theme.colors.background}80` }} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="py-4 text-center text-xs"
        style={{ borderTop: `1px solid ${theme.colors.background}1A`, color: `${theme.colors.background}66` }}
      >
        {theme.brand.name}. {theme.content.copyrightText}
      </div>
    </footer>
  );
}

export function CustomerFooter() {
  const pathname = usePathname();
  const mounted = useIsMounted();
  const cartRestaurantId = useCartStore((s) => s.activeRestaurantId());

  const urlSlug = pathname.match(/(?:^|\/)restaurants\/([^/]+)/)?.[1];
  const isCartFlow = /(?:^|\/)(cart|checkout)(\/|$)/.test(pathname);
  const slug = urlSlug ?? (mounted && isCartFlow ? cartRestaurantId ?? undefined : undefined);

  const restaurantQuery = useQuery({
    queryKey: ["restaurant", slug],
    queryFn: () => getRestaurantByIdOrSlug(slug as string),
    enabled: !!slug,
  });

  if (isCartFlow && !mounted) return null;

  if (slug) {
    return (
      <div style={{ ...getRestaurantThemeStyle(restaurantQuery.data), backgroundColor: "var(--brand-dark)" }} className="mt-auto pb-20 lg:pb-0">
        <RestaurantFooter restaurant={restaurantQuery.data ?? { id: "", name: "" }} />
      </div>
    );
  }

  return <HomepageFooter />;
}
