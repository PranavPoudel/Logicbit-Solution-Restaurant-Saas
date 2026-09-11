// components/home/banner-carousel.tsx
"use client";

import { theme } from "@/config/theme";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  icon: "percent" | "bike" | "chef-hat";
}

// PLACEHOLDER — wired to GET /discovery/advertisements/homepage-banners
// once we confirm the response shape (image URL, link target, etc).
const mockBanners: Banner[] = [
  {
    id: "1",
    title: "Rs 100 off your first order",
    subtitle: "New customers · use code WELCOME100",
    bgColor: theme.colors.primary,
    icon: "percent",
  },
  {
    id: "2",
    title: "Free delivery this weekend",
    subtitle: "On orders above Rs 500",
    bgColor: theme.colors.accent,
    icon: "bike",
  },
  {
    id: "3",
    title: "Momo Fest is here",
    subtitle: "Top-rated momo spots near you",
    bgColor: theme.colors.dark,
    icon: "chef-hat",
  },
];

function BannerIcon({ type }: { type: Banner["icon"] }) {
  const common = {
    viewBox: "0 0 40 40",
    className: `absolute -bottom-4 -right-4 w-24 h-24`,
    style: { opacity: theme.content.bannerIconOpacity },
    fill: "none",
  };

  if (type === "percent") {
    return (
      <svg {...common}>
        <circle cx="13" cy="13" r="4" stroke={theme.colors.background} strokeWidth="2" />
        <circle cx="27" cy="27" r="4" stroke={theme.colors.background} strokeWidth="2" />
        <line x1="10" y1="30" x2="30" y2="10" stroke={theme.colors.background} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "bike") {
    return (
      <svg {...common}>
        <circle cx="10" cy="28" r="6" stroke={theme.colors.background} strokeWidth="2" />
        <circle cx="30" cy="28" r="6" stroke={theme.colors.background} strokeWidth="2" />
        <path
          d="M10 28l8-14h6l6 14M18 14h6"
          stroke={theme.colors.background}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // chef-hat
  return (
    <svg {...common}>
      <path
        d="M12 18c-3 0-5-2.5-5-5.5S9 7 12 7c.5-2 2.5-3.5 5-3.5s4.5 1.5 5 3.5c3 0 5 2.5 5 5.5S25 18 22 18v6H12v-6z"
        stroke={theme.colors.background}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="24" x2="22" y2="24" stroke={theme.colors.background} strokeWidth="2" />
    </svg>
  );
}

export function BannerCarousel() {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {mockBanners.map((banner, index) => (
        <div
          key={banner.id}
          style={{ animationDelay: `${index * 100}ms`, backgroundColor: banner.bgColor }}
          className="snap-start shrink-0 w-[280px] h-[120px] rounded-[1.75rem] p-4 flex flex-col justify-end relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] animate-in fade-in slide-in-from-right-4 fill-mode-backwards"
        >
          <BannerIcon type={banner.icon} />

          <p
            className="font-serif font-semibold text-base leading-tight relative"
            style={{ color: theme.colors.background }}
          >
            {banner.title}
          </p>
          <p className="text-xs mt-1 relative" style={{ color: `${theme.colors.background}BF` }}>
            {banner.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}