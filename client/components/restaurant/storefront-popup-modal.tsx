// components/storefront/storefront-popup-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { PublicPopup } from "@/lib/api/public-storefront";
import { POPUP_TYPES } from "@/lib/api/storefront";
import { theme } from "@/config/theme";
import { AppImage } from "@/components/ui/app-image";

interface StorefrontPopupModalProps {
  popups: PublicPopup[];
}

export function StorefrontPopupModal({ popups }: StorefrontPopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<PublicPopup | null>(null);

  useEffect(() => {
    const popup = popups[0];
    if (popup && !sessionStorage.getItem(`logicbit-storefront-popup-${popup.restaurantId}`)) {
      const timer = setTimeout(() => {
        setCurrentPopup(popup);
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [popups]);

  function dismiss() {
    setIsOpen(false);
    if (currentPopup) sessionStorage.setItem(`logicbit-storefront-popup-${currentPopup.restaurantId}`, "1");
  }

  if (!isOpen || !currentPopup) return null;

  const isExternalAd = currentPopup.type === "EXTERNAL_AD";

  return (
    <div className="fixed bottom-24 left-4 z-40 w-[calc(100vw-2rem)] max-w-xs sm:left-6 lg:bottom-6">
      <div
        role="dialog"
        aria-label={currentPopup.title}
        className="relative w-full overflow-hidden rounded-2xl shadow-2xl animate-slide-in-left"
        style={{
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.dark}0D`,
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full transition-colors"
          style={{ backgroundColor: `${theme.colors.dark}33`, color: theme.colors.background }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.dark}66`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.dark}33`)}
        >
          <X size={18} />
        </button>

        {currentPopup.imageUrl && (
          <AppImage sizes="400px" src={currentPopup.imageUrl} alt={currentPopup.title} className="w-full h-40 object-cover" />
        )}

        <div className="p-6 text-center space-y-4">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${theme.colors.dark}0D`, color: `${theme.colors.dark}99` }}
          >
            {isExternalAd ? "Ad" : POPUP_TYPES.find((t) => t.value === currentPopup.type)?.label ?? "Announcement"}
          </span>
          <h3 className="font-serif font-semibold text-xl" style={{ color: theme.colors.dark }}>
            {currentPopup.title}
          </h3>
          {currentPopup.message && (
            <p className="text-sm" style={{ color: `${theme.colors.dark}A6` }}>
              {currentPopup.message}
            </p>
          )}

          {currentPopup.ctaText && (
            <Link
              href={currentPopup.ctaLink || "#"}
              onClick={dismiss}
              {...(isExternalAd ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}
              className="block w-full py-2.5 font-medium rounded-xl transition-colors"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
            >
              {currentPopup.ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}