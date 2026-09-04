"use client";

import Link from "next/link";
import type { PublicBanner } from "@/lib/api/public-storefront";

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
          className="snap-center shrink-0 w-[85vw] sm:w-[600px] h-48 sm:h-64 rounded-2xl overflow-hidden relative bg-[#2B1410]/5 group border border-[#2B1410]/8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={banner.imageUrl} 
            alt={banner.title || "Banner"} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2B1410]/75 via-[#2B1410]/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-[#FDF6EC]">
            {banner.title && <h3 className="font-serif font-semibold text-xl">{banner.title}</h3>}
            {banner.subtitle && <p className="text-sm text-[#FDF6EC]/85 mt-1">{banner.subtitle}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}