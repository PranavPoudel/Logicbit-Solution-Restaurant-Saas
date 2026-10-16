// components/map/cartoon-map.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon, IconButton } from "@/components/ui/primitives";

const ZOOMS = [1, 1.4, 2, 2.8];

export function CartoonMap({ initial = "•", km }: { initial?: string; km?: number | null }) {
  const t = useTranslations("restaurant");
  const [z, setZ] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!active) return;
      e.preventDefault();
      setZ((v) => Math.max(0, Math.min(ZOOMS.length - 1, v + (e.deltaY < 0 ? 1 : -1))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [active]);

  return (
    <div ref={ref} onMouseLeave={() => setActive(false)} className="relative h-full min-h-[260px] overflow-hidden rounded-[32px] rounded-tl-[120px] bg-map-land md:min-h-[380px]">
      <div className="absolute inset-0 transition-transform duration-500" style={{ transform: `scale(${ZOOMS[z]})`, transformOrigin: "50% 50%" }}>
        <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
          <g transform="translate(500 250) scale(0.6) translate(-500 -250)">
            <rect x="-1000" y="-500" width="3000" height="1500" className="fill-map-land" />
            <ellipse cx="150" cy="110" rx="140" ry="80" className="fill-map-park" />
            <ellipse cx="800" cy="390" rx="130" ry="70" className="fill-map-park" />
            <circle cx="680" cy="110" r="44" className="fill-map-park" />
            <ellipse cx="-300" cy="450" rx="130" ry="80" className="fill-map-park" />
            <ellipse cx="1300" cy="120" rx="120" ry="70" className="fill-map-park" />
            <circle cx="1150" cy="480" r="50" className="fill-map-park" />
            <path d="M-600 380 C -380 300, -160 440, 100 380 S 420 300, 600 380 S 880 300, 1100 360 S 1400 300, 1600 340" className="stroke-map-water" strokeWidth="26" fill="none" strokeLinecap="round" />
            <g className="stroke-map-road" strokeWidth="10" strokeLinecap="round" fill="none">
              <path d="M-600 200h2200M-600 300h2200M-250 -300v1100M250 -300v1100M640 -300v1100M1050 -300v1100M-100 800L450 -200M800 -200l400 520" />
            </g>
            <g className="stroke-chili" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round" fill="none">
              <path d="M-600 250 C -200 240, 300 220, 500 250 S 1100 260, 1600 250" />
              <path d="M500 -300 C 504 0, 494 180, 500 250 S 514 600, 504 800" />
            </g>
          </g>
        </svg>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" style={{ transform: `translate(-50%,-100%) scale(${1 / ZOOMS[z]})`, transformOrigin: "50% 100%" }}>
          <span className="relative inline-grid place-items-center">
            <span className="absolute -bottom-1 h-2 w-8 rounded-[50%] bg-espresso/25 blur-[2px]" />
            <span className="shadow-soft relative grid h-16 w-16 -rotate-45 place-items-center rounded-full rounded-bl-none border-4 border-white bg-[var(--accent,var(--brand-chili))]">
              <span className="rotate-45 font-display text-xl font-extrabold text-[var(--accent-ink,var(--brand-parchment))]">{initial.charAt(0).toUpperCase()}</span>
            </span>
          </span>
        </span>
      </div>

      {km != null && (
        <span className="shadow-soft absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-bold md:left-24">
          <Icon name="pin" className="h-5 w-5 text-chili" />{t("kmFromYou", { km: km.toFixed(1) })}
        </span>
      )}
      {!active && (
        <button type="button" onClick={() => setActive(true)} className="absolute inset-0 z-[5] hidden items-end justify-center pb-8 md:flex" aria-label={t("exploreMap")}>
          <span className="shadow-soft flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2 font-bold text-cream"><Icon name="search" className="h-5 w-5" />{t("exploreMap")}</span>
        </button>
      )}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <IconButton icon="plus" label={t("zoomIn")} disabled={z === ZOOMS.length - 1} onClick={() => setZ(z + 1)} className="shadow-soft bg-paper disabled:opacity-40" />
        <IconButton icon="minus" label={t("zoomOut")} disabled={z === 0} onClick={() => setZ(z - 1)} className="shadow-soft bg-paper disabled:opacity-40" />
      </div>
    </div>
  );
}
