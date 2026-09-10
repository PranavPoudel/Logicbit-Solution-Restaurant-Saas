// components/home/popup-ad.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Percent } from "lucide-react";

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
      className="fixed inset-0 z-50 bg-[#2B1410]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FDF6EC] rounded-[2rem] w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-300 shadow-2xl shadow-black/30 border border-[#2B1410]/5"
      >
        <div className="h-40 bg-[#C0392B] flex flex-col items-center justify-center relative overflow-hidden">
          {/* faint tomato icon for texture, matches hero */}
          <svg
            viewBox="0 0 40 40"
            className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.15]"
            fill="none"
          >
            <circle cx="20" cy="22" r="14" fill="#FDF6EC" />
            <path
              d="M16 10c1-2 3-3 4-3s3 1 4 3"
              stroke="#FDF6EC"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FDF6EC]/90 hover:bg-[#FDF6EC] hover:scale-110 active:scale-95 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X size={14} className="text-[#2B1410]" />
          </button>
          <div className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 mb-2 animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
            <Percent size={14} className="text-[#FDF6EC]" />
            <span className="text-[#FDF6EC] font-bold text-sm">20% OFF</span>
          </div>
          <p className="text-[#FDF6EC] font-serif text-2xl font-semibold text-center px-6 relative animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:250ms] [animation-fill-mode:backwards]">
            Weekend Feast Sale
          </p>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-[#2B1410]/55 mb-4">
            Get 20% off on your first 3 orders this weekend.
          </p>
          <button
            onClick={dismiss}
            className="w-full bg-[#2B1410] text-[#FDF6EC] text-sm font-medium py-2.5 rounded-2xl hover:bg-[#3D1E17] active:scale-95 transition-all duration-200"
          >
            Explore restaurants
          </button>
        </div>
      </div>
    </div>
  );
}