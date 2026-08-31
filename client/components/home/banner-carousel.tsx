// components/home/banner-carousel.tsx
"use client";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
}

// PLACEHOLDER — wired to GET /discovery/advertisements/homepage-banners
// once we confirm the response shape (image URL, link target, etc).
const mockBanners: Banner[] = [
  {
    id: "1",
    title: "Rs 100 off your first order",
    subtitle: "New customers · use code WELCOME100",
    gradient: "from-[#E3A008] to-[#C6870A]",
  },
  {
    id: "2",
    title: "Free delivery this weekend",
    subtitle: "On orders above Rs 500",
    gradient: "from-[#0F6B5C] to-[#0B4F44]",
  },
  {
    id: "3",
    title: "Momo Fest is here",
    subtitle: "Top-rated momo spots near you",
    gradient: "from-[#17181C] to-[#2B2D33]",
  },
];

export function BannerCarousel() {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {mockBanners.map((banner, index) => (
        <div
          key={banner.id}
          style={{ animationDelay: `${index * 100}ms` }}
          className={`snap-start shrink-0 w-[280px] h-[120px] rounded-[1.75rem] bg-gradient-to-br ${banner.gradient} p-4 flex flex-col justify-end relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] animate-in fade-in slide-in-from-right-4 fill-mode-backwards`}
        >
          {/* soft glow blob for extra life, matches hero/popup treatment */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />

          <p className="text-white font-display font-semibold text-base leading-tight relative">
            {banner.title}
          </p>
          <p className="text-white/80 text-xs mt-1 relative">{banner.subtitle}</p>
        </div>
      ))}
    </div>
  );
}