// components/home/cities-near-me.tsx
"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon, IconButton, Squiggle } from "@/components/ui/primitives";

/* Projection: Nepal lon/lat -> SVG coordinates, cropped to VB */
const px = (lon: number) => 240 + ((lon - 80.05) / 8.15) * 520;
const py = (lat: number) => 20 + ((30.45 - lat) / 4.1) * 260;
const pts = (a: number[][]) => a.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(" ");
const VB = { x: 230, y: 10, w: 540, h: 280 };
const pctX = (lon: number) => ((px(lon) - VB.x) / VB.w) * 100;
const pctY = (lat: number) => ((py(lat) - VB.y) / VB.h) * 100;

const NEPAL = [[80.06, 28.84], [80.5, 29.2], [80.25, 29.75], [80.9, 30.2], [81.3, 30.45], [82.1, 30.1], [83.2, 29.6], [83.9, 29.3], [84.6, 28.9], [85.2, 28.6], [85.9, 28.3], [86.6, 28.1], [87.2, 27.95], [88.1, 27.9], [88.2, 27.4], [88.0, 26.9], [88.15, 26.45], [87.5, 26.36], [86.8, 26.45], [86.0, 26.6], [85.2, 26.8], [84.6, 27.1], [84.1, 27.5], [83.3, 27.35], [82.5, 27.6], [81.8, 27.9], [81.0, 28.4], [80.5, 28.6]];
const RIVERS = [
  [[81.4, 30.1], [81.5, 29.3], [81.2, 28.7], [81.1, 28.35]],
  [[83.7, 29.1], [83.9, 28.5], [84.2, 27.9], [84.0, 27.4]],
  [[86.9, 28.0], [86.8, 27.3], [87.1, 26.9], [87.0, 26.4]],
];
const ROADS = [
  [[80.3, 28.7], [81.62, 28.05], [82.5, 27.75], [83.45, 27.7], [84.43, 27.68], [84.88, 27.01], [85.92, 26.73], [87.27, 26.81], [88.0, 26.6]],
  [[83.99, 28.21], [84.43, 27.68], [85.32, 27.75]],
  [[85.32, 27.75], [84.88, 27.01]],
  [[87.28, 26.81], [87.27, 26.45]],
];

export const CITIES: { name: string; lon?: number; lat?: number }[] = [
  { name: "Kathmandu", lon: 85.32, lat: 27.78 },
  { name: "Patan", lon: 85.12, lat: 27.52 },
  { name: "Bhaktapur", lon: 85.62, lat: 27.66 },
  { name: "Pokhara", lon: 83.99, lat: 28.21 },
  { name: "Chitwan", lon: 84.43, lat: 27.62 },
  { name: "Biratnagar", lon: 87.27, lat: 26.45 },
  { name: "Butwal", lon: 83.45, lat: 27.7 },
  { name: "Dharan", lon: 87.28, lat: 26.85 },
  { name: "Birgunj", lon: 84.88, lat: 27.01 },
  { name: "Janakpur", lon: 85.92, lat: 26.73 },
  { name: "Nepalgunj", lon: 81.62, lat: 28.05 },
  { name: "Hetauda" },
  { name: "Itahari" },
  { name: "Dhangadhi" },
  { name: "Bharatpur" },
  { name: "Lumbini" },
];
const ZOOMS = [1, 1.5, 2.4, 3.6];

type City = (typeof CITIES)[number];

function MapPin({ c, count, zoom, active, onActive, onPick }: { c: City; count: number; zoom: number; active: boolean; onActive: (n: string | null) => void; onPick: () => void }) {
  const t = useTranslations("cities");
  const label = t.has(`names.${c.name}`) ? t(`names.${c.name}`) : c.name;
  return (
    <div className="absolute" style={{ left: `${pctX(c.lon!)}%`, top: `${pctY(c.lat!)}%`, transform: `translate(-50%, -100%) scale(${1 / zoom})`, transformOrigin: "50% 100%", zIndex: active ? 20 : 10 }}>
      <button
        onClick={onPick}
        onMouseEnter={() => onActive(c.name)}
        onMouseLeave={() => onActive(null)}
        onFocus={() => onActive(c.name)}
        onBlur={() => onActive(null)}
        aria-label={t("pinLabel", { city: label, count })}
        className="group flex flex-col items-center"
      >
        <span className={`shadow-soft flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 font-display text-sm font-extrabold transition md:text-base ${active ? "bg-ink text-cream" : "bg-paper text-ink"}`}>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-chili text-cream">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          {label}
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-cream/20" : "bg-saffron"}`}>{count}</span>
        </span>
        <span className={`-mt-px h-2.5 w-2.5 rotate-45 ${active ? "bg-ink" : "bg-paper"}`} aria-hidden />
        <span className="relative mt-0.5 flex h-3 w-3" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-chili opacity-60" />
          <span className="relative h-3 w-3 rounded-full border-2 border-paper bg-chili" />
        </span>
      </button>
    </div>
  );
}

export function CitiesNearMe({ counts, selected, loading }: { counts: Record<string, number>; selected?: string; loading?: boolean }) {
  const t = useTranslations("cities");
  const cityName = (name: string) => (t.has(`names.${name}`) ? t(`names.${name}`) : name);
  const router = useRouter();
  const [z, setZ] = useState(1);
  const [active, setActive] = useState<string | null>(null);

  const pick = (name: string) => router.push(`/restaurants?city=${encodeURIComponent(name)}`);
  const zoom = ZOOMS[z];
  const ktm = CITIES[0];
  const origin = `${pctX(ktm.lon!)}% ${pctY(ktm.lat!)}%`;
  const liveCities = CITIES.filter((c) => (counts[c.name] ?? 0) > 0);
  const soon = CITIES.filter((c) => (counts[c.name] ?? 0) === 0);

  return (
    <section aria-labelledby="cities" className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="cities" className="font-display text-[40px] font-extrabold leading-tight tracking-tight md:text-[56px]">
          {t("titleStart")}{" "}
          <span className="relative inline-block">
            {t("titleAccent")}
            <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-saffron md:h-4" />
          </span>
        </h2>
        <Link href="/restaurants" className="group flex min-h-11 items-center gap-2 font-bold hover:text-chili">
          <span className="underline-offset-4 group-hover:underline">{t("viewAll")}</span>
          <Icon name="arrow" className="h-5 w-5 transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="shadow-warm relative aspect-[540/280] min-h-[240px] w-full overflow-hidden rounded-[28px] bg-map-sea">
          {loading ? (
            <div className="shimmer absolute inset-0" role="status" aria-label={t("loadingMap")} />
          ) : (
            <>
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{ transform: `scale(${zoom})`, transformOrigin: origin } as CSSProperties}
              >
                <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
                  <defs>
                    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" className="fill-ink/10" /></pattern>
                  </defs>
                  <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#dots)" />
                  <polygon points={pts(NEPAL)} className="fill-map-land stroke-ink/25" strokeWidth="2" strokeDasharray="6 5" strokeLinejoin="round" />
                  <path d={`M${px(80.4)} ${py(29.1)} C ${px(82)} ${py(29.6)}, ${px(84)} ${py(28.9)}, ${px(85.6)} ${py(28.4)} S ${px(87.5)} ${py(27.9)}, ${px(88)} ${py(27.6)}`} className="stroke-map-park" strokeWidth="34" strokeLinecap="round" fill="none" opacity=".9" />
                  <ellipse cx={px(84.4)} cy={py(27.5)} rx="26" ry="10" className="fill-map-park" />
                  <ellipse cx={px(85.35)} cy={py(27.68)} rx="24" ry="16" className="fill-map-park" opacity=".8" />
                  <ellipse cx={px(81.3)} cy={py(28.5)} rx="16" ry="9" className="fill-map-park" />
                  {RIVERS.map((r, i) => <polyline key={i} points={pts(r)} className="stroke-map-water" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
                  {ROADS.map((r, i) => <polyline key={i} points={pts(r)} className="stroke-map-road" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
                  <text x={px(86.2)} y={py(28.9)} className="fill-ink/35 font-display" fontSize="16" fontWeight="800" letterSpacing="6">{t("himalaya")}</text>
                  <text x={px(82.6)} y={py(26.8)} className="fill-ink/25 font-display" fontSize="14" fontWeight="700" letterSpacing="4">{t("terai")}</text>
                </svg>
                {liveCities.filter((c) => c.lon).map((c) => (
                  <MapPin key={c.name} c={c} count={counts[c.name] ?? 0} zoom={zoom} active={active === c.name} onActive={setActive} onPick={() => pick(c.name)} />
                ))}
              </div>

              <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-2xl bg-paper shadow-soft">
                <IconButton icon="plus" label={t("zoomIn")} disabled={z === ZOOMS.length - 1} onClick={() => setZ(z + 1)} className="!rounded-none hover:bg-ink/5 disabled:opacity-30" />
                <span className="mx-2 h-px bg-ink/10" />
                <IconButton icon="minus" label={t("zoomOut")} disabled={z === 0} onClick={() => setZ(z - 1)} className="!rounded-none hover:bg-ink/5 disabled:opacity-30" />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink/60">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-herb" />
              {t("deliveringNow", { count: liveCities.length })}
            </p>
            <ul className="mt-3 space-y-2">
              {liveCities.map((c) => {
                const count = counts[c.name] ?? 0;
                const here = c.name === selected;
                return (
                  <li key={c.name}>
                    <button
                      onClick={() => pick(c.name)}
                      onMouseEnter={() => setActive(c.name)}
                      onMouseLeave={() => setActive(null)}
                      className={`shadow-soft group flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left transition hover:-translate-y-0.5 ${here ? "border-chili bg-chili/10" : "border-ink/10 bg-paper"}`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chili text-cream"><Icon name="pin" className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-extrabold leading-tight">{cityName(c.name)}</span>
                        <span className="block text-sm text-ink/65">{t("kitchensOpen", { count })}</span>
                      </span>
                      <Icon name="arrow" className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
                    </button>
                  </li>
                );
              })}
              {!loading && liveCities.length === 0 && <li className="text-ink/65">{t("noneYet")}</li>}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-ink/60">{t("comingSoon")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {soon.map((c) => (
                <li key={c.name} className="rounded-full bg-ink/10 px-3 py-1 text-sm font-medium text-ink/65">{cityName(c.name)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
