// components/storefront/storefront-popup-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { PublicPopup } from "@/lib/api/public-storefront";
import { theme } from "@/config/theme";
import { AppImage } from "@/components/ui/app-image";

interface StorefrontPopupModalProps {
  popups: PublicPopup[];
}

export function StorefrontPopupModal({ popups }: StorefrontPopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<PublicPopup | null>(null);

  useEffect(() => {
    if (popups.length > 0) {
      // Show the first active popup after a 1.5 second delay
      const timer = setTimeout(() => {
        setCurrentPopup(popups[0]);
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [popups]);

  if (!isOpen || !currentPopup) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: `${theme.colors.dark}99` }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative"
        style={{
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.dark}0D`,
        }}
      >
        <button
          onClick={() => setIsOpen(false)}
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
              onClick={() => setIsOpen(false)}
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