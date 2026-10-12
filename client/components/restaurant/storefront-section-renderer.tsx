"use client";

import { SectionSetting } from "@/lib/api/discovery";
import { StorefrontBannerCarousel } from "./storefront-banner-carousel";
import { StorefrontOffersSection } from "./storefront-offers-section";
import { StorefrontMenuSection } from "./storefront-menu-section";
import { StorefrontAboutSection } from "./storefront-about-section";
import { StorefrontContactSection } from "./storefront-contact-section";
import { StorefrontReviewsSection } from "./storefront-reviews-section";
import type { MenuCategory, MenuItem } from "@/types/menu";
import type { PublicBanner } from "@/lib/api/public-storefront";

interface StorefrontSectionRendererProps {
  sectionSettings: SectionSetting[];
  restaurantId: string;
  locale?: string; // ✅ Renamed to 'locale' to cleanly match the URL locale
  categories?: MenuCategory[];
  menuItems?: MenuItem[];
  onOpenModifiers?: (itemId: string) => void;
  aboutText?: string;
  contact?: { phone?: string; email?: string; address?: string };
  socialLinks?: Record<string, string>;
  banners?: PublicBanner[];
  latitude?: number;
  longitude?: number;
}

const DEFAULT_SECTIONS: SectionSetting[] = [
  { id: "banner", isVisible: true, titleEn: "Highlights", titleJa: "ハイライト" },
  { id: "contact", isVisible: true, titleEn: "Contact", titleJa: "お問い合わせ" },
  { id: "menu", isVisible: true, titleEn: "Menu", titleJa: "メニュー" },
  { id: "about", isVisible: true, titleEn: "About Us", titleJa: "私たちについて" },
  { id: "reviews", isVisible: true, titleEn: "Reviews", titleJa: "レビュー" },
];

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
  const visibleSections = (sectionSettings.length > 0 ? sectionSettings : DEFAULT_SECTIONS).filter(
    (s) => s.isVisible
  );

  const contactBesideMenu =
    categories.length > 0 &&
    visibleSections.some((v) => v.id === "menu") &&
    visibleSections.some((v) => v.id === "contact");

  const titleOf = (s: SectionSetting) => (locale === "ja" ? s.titleJa || s.titleEn : s.titleEn);
  const contactSection = visibleSections.find((v) => v.id === "contact");
  const contactTitle = (contactSection && titleOf(contactSection)) || "Contact";

  return (
    <div className="space-y-0">
      {visibleSections.map((section) => {
        // ✅ Safely fallback to titleEn if titleJa is missing or empty
        const title = titleOf(section);

        switch (section.id) {
          case "banner":
            if (banners.length === 0) return null;
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
              <div key={section.id} className="pt-8 pb-0">
                <StorefrontMenuSection
                  title={title}
                  categories={categories}
                  aside={
                    contactBesideMenu ? (
                      <StorefrontContactSection
                        title={contactTitle}
                        contact={contact}
                        socialLinks={socialLinks}
                        latitude={latitude}
                        longitude={longitude}
                        embedded
                      />
                    ) : undefined
                  }
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
            if (contactBesideMenu) return null;
            return (
              <div key={section.id} className="pt-4 pb-2">
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
              <div key={section.id} className="pt-0 pb-8">
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