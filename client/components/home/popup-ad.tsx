// components/home/popup-ad.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Percent } from "lucide-react";
import { theme } from "@/config/theme";

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
      className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ backgroundColor: `${theme.colors.dark}80` }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-[2rem] w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-300 shadow-2xl shadow-black/30"
        style={{
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.dark}0D`,
        }}
      >
        <div
          className="h-40 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {/* faint tomato icon for texture, matches hero */}
          <svg
            viewBox="0 0 40 40"
            className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.15]"
            fill="none"
          >
            <circle cx="20" cy="22" r="14" fill={theme.colors.background} />
            <path
              d="M16 10c1-2 3-3 4-3s3 1 4 3"
              stroke={theme.colors.background}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full hover:scale-110 active:scale-95 flex items-center justify-center transition-all"
            style={{ backgroundColor: `${theme.colors.background}E6` }}
            aria-label="Close"
          >
            <X size={14} style={{ color: theme.colors.dark }} />
          </button>
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1 mb-2 animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <Percent size={14} style={{ color: theme.colors.background }} />
            <span className="font-bold text-sm" style={{ color: theme.colors.background }}>
              {theme.content.popupDiscountLabel}
            </span>
          </div>
          <p
            className="font-serif text-2xl font-semibold text-center px-6 relative animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:250ms] [animation-fill-mode:backwards]"
            style={{ color: theme.colors.background }}
          >
            {theme.content.popupTitle}
          </p>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm mb-4" style={{ color: `${theme.colors.dark}8C` }}>
            {theme.content.popupSubtext}
          </p>
          <button
            onClick={dismiss}
            className="w-full text-sm font-medium py-2.5 rounded-2xl active:scale-95 transition-all duration-200"
            style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.darkHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.dark)}
          >
            {theme.content.popupCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}