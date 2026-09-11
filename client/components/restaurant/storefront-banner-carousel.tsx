// components/storefront/storefront-banner-carousel.tsx
"use client";

import Link from "next/link";
import type { PublicBanner } from "@/lib/api/public-storefront";
import { theme } from "@/config/theme";

interface StorefrontBannerCarouselProps {
  banners: PublicBanner[];
}

export function StorefrontBannerCarousel({ banners }: StorefrontBannerCarouselProps) {
  if (banners.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 scrollbar-hide">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.linkUrl || "#"}
          className="snap-center shrink-0 w-[85vw] sm:w-[600px] h-48 sm:h-64 rounded-2xl overflow-hidden relative group"
          style={{
            backgroundColor: `${theme.colors.dark}0D`,
            border: `1px solid ${theme.colors.dark}14`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${theme.colors.dark}BF, ${theme.colors.dark}1A, transparent)`,
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-5" style={{ color: theme.colors.background }}>
            {banner.title && <h3 className="font-serif font-semibold text-xl">{banner.title}</h3>}
            {banner.subtitle && (
              <p className="text-sm mt-1" style={{ color: `${theme.colors.background}D9` }}>
                {banner.subtitle}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}