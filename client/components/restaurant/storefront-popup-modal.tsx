// components/storefront/storefront-popup-modal.tsx
"use client";

import { useEffect, useState } from "react";
import type { PublicPopup } from "@/lib/api/public-storefront";
import { POPUP_TYPES } from "@/lib/api/storefront";
import { getFullImageUrl } from "@/lib/utils/image";
import { PromoCard } from "@/components/ui/promo-card";

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
  const sticker = isExternalAd ? "Ad" : POPUP_TYPES.find((t) => t.value === currentPopup.type)?.label ?? "Announcement";

  return (
    <PromoCard
      label={currentPopup.title}
      sticker={sticker}
      headline={currentPopup.title}
      body={currentPopup.message}
      image={currentPopup.imageUrl ? getFullImageUrl(currentPopup.imageUrl) : "/images/cuisine-nepali.jpg.avif"}
      cta={currentPopup.ctaText ? { text: currentPopup.ctaText, href: currentPopup.ctaLink || "#", external: isExternalAd } : undefined}
      onClose={dismiss}
    />
  );
}
