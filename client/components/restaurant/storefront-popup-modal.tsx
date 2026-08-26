"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { PublicPopup } from "@/lib/api/public-storefront";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 z-10 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
        >
          <X size={18} />
        </button>

        {currentPopup.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentPopup.imageUrl} alt={currentPopup.title} className="w-full h-40 object-cover" />
        )}

        <div className="p-6 text-center space-y-4">
          <h3 className="font-display font-bold text-xl text-[#17181C]">{currentPopup.title}</h3>
          {currentPopup.message && (
            <p className="text-sm text-neutral-600">{currentPopup.message}</p>
          )}
          
          {currentPopup.ctaText && (
            <Link
              href={currentPopup.ctaLink || "#"}
              onClick={() => setIsOpen(false)}
              className="block w-full py-2.5 bg-[#E3A008] hover:bg-[#d49207] text-[#17181C] font-semibold rounded-xl transition-colors"
            >
              {currentPopup.ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}