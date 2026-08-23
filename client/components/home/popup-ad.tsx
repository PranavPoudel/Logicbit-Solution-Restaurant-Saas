// components/home/popup-ad.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// PLACEHOLDER — wired to GET /discovery/advertisements/popup once we
// confirm the response shape.
export function PopupAd() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("logicbit-popup-shown");
    if (!alreadyShown) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("logicbit-popup-shown", "1");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="h-40 bg-gradient-to-br from-[#E3A008] to-[#C6870A] flex items-center justify-center relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={14} className="text-[#17181C]" />
          </button>
          <p className="text-white font-display text-2xl font-semibold text-center px-6">
            Weekend Feast Sale
          </p>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-neutral-500 mb-4">
            Get 20% off on your first 3 orders this weekend.
          </p>
          <button
            onClick={dismiss}
            className="w-full bg-[#17181C] text-white text-sm font-medium py-2.5 rounded-xl"
          >
            Explore restaurants
          </button>
        </div>
      </div>
    </div>
  );
}
