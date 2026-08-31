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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-300 shadow-2xl shadow-black/30"
      >
        <div className="h-40 bg-gradient-to-br from-[#E3A008] to-[#C6870A] flex flex-col items-center justify-center relative overflow-hidden">
          {/* soft glowing blob for extra life */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse [animation-duration:4s]" />

          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white hover:scale-110 active:scale-95 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X size={14} className="text-[#17181C]" />
          </button>
          <div className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 mb-2 animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
            <Percent size={14} className="text-white" />
            <span className="text-white font-bold text-sm">20% OFF</span>
          </div>
          <p className="text-white font-display text-2xl font-semibold text-center px-6 relative animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:250ms] [animation-fill-mode:backwards]">
            Weekend Feast Sale
          </p>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-neutral-500 mb-4">
            Get 20% off on your first 3 orders this weekend.
          </p>
          <button
            onClick={dismiss}
            className="w-full bg-[#17181C] text-white text-sm font-medium py-2.5 rounded-2xl hover:bg-[#0F6B5C] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#0F6B5C]/30 active:scale-95 transition-all duration-200"
          >
            Explore restaurants
          </button>
        </div>
      </div>
    </div>
  );
}