"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // ✅ Re-added from HEAD for clickable banners
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

interface StorefrontBannerCarouselProps {
  banners: Banner[];
}

export function StorefrontBannerCarousel({ banners }: StorefrontBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const goToSlide = (index: number) => {
    setCurrentIndex((index + banners.length) % banners.length);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => {
          // ✅ Extract content so we can conditionally wrap it in a Link
          const Content = (
            <div className="w-full flex-shrink-0 relative h-[200px] sm:h-[260px] lg:h-[320px]">
              <AppImage
                sizes="100vw"
                src={banner.imageUrl}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover"
              />
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                  <div className="p-6 sm:p-10 text-white">
                    {banner.title && (
                      <h2 className="font-display text-2xl sm:text-4xl font-bold mb-2 drop-shadow-lg">
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );

          return (
            <div key={banner.id} className="w-full flex-shrink-0">
              {banner.linkUrl ? (
                <Link href={banner.linkUrl} className="block w-full hover:opacity-95 transition-opacity">
                  {Content}
                </Link>
              ) : (
                Content
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => goToSlide(currentIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goToSlide(currentIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-colors"
            aria-label="Next banner"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="group grid h-11 min-w-6 place-items-center px-1"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50 group-hover:bg-white/70"
                }`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}