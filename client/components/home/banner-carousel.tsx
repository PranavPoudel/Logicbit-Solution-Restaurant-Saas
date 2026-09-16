// components/home/banner-carousel.tsx
"use client";

import { theme } from "@/config/theme";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  imagePosition?: string;
}

// PLACEHOLDER — wired to GET /discovery/advertisements/homepage-banners
// once we confirm the response shape (image URL, link target, etc).
const mockBanners: Banner[] = [
  {
    id: "1",
    title: "20% Off First Order",
    subtitle: "Use code WELCOME100",
    cta: "Order now",
    image: "/images/promo-discount.jpg",
  },
  {
    id: "2",
    title: "Free Delivery Above Rs 500",
    subtitle: "This weekend only",
    cta: "Explore",
    image: "/images/promo-delivery.jpg",
    imagePosition: "center 20%",
  },
  {
    id: "3",
    title: "Momo Fest is Here",
    subtitle: "Top-rated momo spots near you",
    cta: "Order now",
    image: "/images/promo-momo.jpg",
  },
];

export function BannerCarousel() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {mockBanners.map((banner) => (
        <div
          key={banner.id}
          className="relative rounded-2xl overflow-hidden h-[150px] cursor-pointer group"
          style={{ boxShadow: `0 1px 4px ${theme.colors.dark}14` }}
        >
          <img
            src={banner.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: banner.imagePosition ?? "center" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${theme.colors.dark}00 30%, ${theme.colors.dark}CC 100%)`,
            }}
          />
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <p className="font-serif font-semibold text-base leading-tight" style={{ color: theme.colors.background }}>
              {banner.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: `${theme.colors.background}CC` }}>
              {banner.subtitle}
            </p>
            <span
              className="text-xs font-medium mt-2 inline-flex items-center gap-1 w-fit"
              style={{ color: theme.colors.ratingGold }}
            >
              {banner.cta} →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}