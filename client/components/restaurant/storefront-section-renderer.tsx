"use client";

import { SectionSetting } from "@/lib/api/discovery";
import { StorefrontBannerCarousel } from "./storefront-banner-carousel";
import { StorefrontOffersSection } from "./storefront-offers-section";
import { StorefrontMenuSection } from "./storefront-menu-section";
import { StorefrontAboutSection } from "./storefront-about-section";
import { StorefrontContactSection } from "./storefront-contact-section";
import { StorefrontReviewsSection } from "./storefront-reviews-section";

interface StorefrontSectionRendererProps {
  sectionSettings: SectionSetting[];
  restaurantId: string;
  locale?: string; // ✅ Renamed to 'locale' to cleanly match the URL locale
  categories?: any[];
  menuItems?: any[];
  onOpenModifiers?: (itemId: string) => void;
  aboutText?: string;
  contact?: { phone?: string; email?: string; address?: string };
  socialLinks?: Record<string, string>;
  banners?: any[];
  latitude?: number;
  longitude?: number;
}

export function StorefrontSectionRenderer({
  sectionSettings,
  restaurantId,
  locale = "en", // ✅ Defaults to 'en'
  categories = [],
  onOpenModifiers,
  aboutText,
  contact,
  socialLinks,
  banners = [],
  latitude,
  longitude,
}: StorefrontSectionRendererProps) {
  const visibleSections = sectionSettings.filter((s) => s.isVisible);

  // ✅ Debug log: Check if the backend is actually sending titleJa
  if (process.env.NODE_ENV === "development") {
    console.log("[StorefrontSectionRenderer] Active locale:", locale);
    console.log("[StorefrontSectionRenderer] sectionSettings payload:", sectionSettings);
  }

  return (
    <div className="space-y-0">
      {visibleSections.map((section) => {
        // ✅ Safely fallback to titleEn if titleJa is missing or empty
        const title = locale === "ja" ? (section.titleJa || section.titleEn) : section.titleEn;

        switch (section.id) {
          case "banner":
            return (
              <div key={section.id} className="py-6">
                <StorefrontBannerCarousel banners={banners} />
              </div>
            );

          case "offers":
            return (
              <div key={section.id} className="py-8">
                <StorefrontOffersSection title={title} restaurantId={restaurantId} />
              </div>
            );

          case "menu":
            return (
              <div key={section.id} className="py-8">
                   <StorefrontMenuSection
                  title={title}
                  restaurantId={restaurantId}
                  categories={categories}
                  onOpenModifiers={onOpenModifiers}
                />
                
              </div>
            );

          case "about":
            return (
              <div key={section.id} className="py-8">
                <StorefrontAboutSection title={title} aboutText={aboutText} />
              </div>
            );

          case "contact":
            return (
              <div key={section.id} className="py-8">
                <StorefrontContactSection
                  title={title}
                  contact={contact}
                  socialLinks={socialLinks}
                  latitude={latitude}
                  longitude={longitude}
                />
              </div>
            );

          case "reviews":
            return (
              <div key={section.id} className="py-8">
                <StorefrontReviewsSection title={title} restaurantId={restaurantId} />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}