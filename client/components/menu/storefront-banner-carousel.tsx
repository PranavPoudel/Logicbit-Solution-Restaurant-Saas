// components/menu/storefront-banner-carousel.tsx
"use client";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
}

// PLACEHOLDER — wired to restaurant-specific promo data once backend
// endpoint is confirmed (per-restaurant offers, not homepage-wide ones).
const mockBanners: Banner[] = [
  {
    id: "1",
    title: "20% off orders above Rs 1,500",
    subtitle: "Limited time offer",
    bg: "bg-[#C0392B]",
  },
  {
    id: "2",
    title: "Free delivery today",
    subtitle: "On this restaurant's menu",
    bg: "bg-[#5B8C5A]",
  },
];

export function StorefrontBannerCarousel() {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {mockBanners.map((banner, index) => (
        <div
          key={banner.id}
          style={{ animationDelay: `${index * 100}ms` }}
          className={`snap-start shrink-0 w-[280px] h-[110px] rounded-[1.75rem] ${banner.bg} p-4 flex flex-col justify-end relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] animate-in fade-in slide-in-from-right-4 fill-mode-backwards`}
        >
          <svg
            viewBox="0 0 40 40"
            className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.12]"
            fill="none"
          >
            <circle cx="20" cy="22" r="14" fill="#FDF6EC" />
            <path
              d="M16 10c1-2 3-3 4-3s3 1 4 3"
              stroke="#FDF6EC"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          <p className="text-[#FDF6EC] font-serif font-semibold text-base leading-tight relative">
            {banner.title}
          </p>
          <p className="text-[#FDF6EC]/75 text-xs mt-1 relative">{banner.subtitle}</p>
        </div>
      ))}
    </div>
  );
}