// components/restaurant/storefront-contact-section.tsx
"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useGeolocation } from "@/hooks/use-geolocation";
import { CartoonMap } from "@/components/map/cartoon-map";
import { DynamicRestaurantLocationMap } from "@/components/map/dynamic-restaurant-location-map";
import { Button, Icon, Squiggle } from "@/components/ui/primitives";

interface StorefrontContactSectionProps {
  title: string;
  name?: string;
  contact?: { phone?: string; email?: string; address?: string };
  socialLinks?: Record<string, string>;
  latitude?: number;
  longitude?: number;
}

const SOCIAL: Record<string, { label: string; path: ReactNode }> = {
  instagram: { label: "Instagram", path: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" /><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" /></> },
  facebook: { label: "Facebook", path: <path fill="currentColor" d="M14 8V6.5c0-.7.4-1 1-1h2V2h-3c-2.8 0-4 1.8-4 4.3V8H8v3.5h2V22h4V11.5h2.7L17 8h-3z" /> },
  tiktok: { label: "TikTok", path: <path fill="currentColor" d="M16.5 2h-3.3v13.2a2.9 2.9 0 11-2.9-2.9c.3 0 .6 0 .9.1V9a6.2 6.2 0 105.3 6.2V8.6a7.6 7.6 0 004.5 1.5V6.8a4.5 4.5 0 01-4.5-4.8z" /> },
  whatsapp: { label: "WhatsApp", path: <path fill="currentColor" d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /> },
};

const TINTS = { herb: "bg-herb/15 text-herb", chili: "bg-chili/10 text-chili", saffron: "bg-saffron/30 text-espresso" };

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function ContactRow({ icon, tint, label, value, href, external }: { icon: string; tint: keyof typeof TINTS; label: string; value?: string; href: string; external?: boolean }) {
  if (!value) return null;
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="group flex min-h-14 items-center gap-4 rounded-[22px] px-3 py-2 transition hover:bg-ink/5 active:scale-[.99]">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${TINTS[tint]}`}><Icon name={icon} className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-ink/75">{label}</span>
        <span className="block truncate text-lg font-bold">{value}</span>
      </span>
      <Icon name="arrow" className="h-5 w-5 shrink-0 text-ink/60 transition group-hover:translate-x-1 group-hover:text-ink" />
    </a>
  );
}

export function StorefrontContactSection({ title, name, contact, socialLinks, latitude, longitude }: StorefrontContactSectionProps) {
  const t = useTranslations("restaurant");
  const geo = useGeolocation();
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<"cartoon" | "street">("cartoon");
  const socials = Object.entries(socialLinks ?? {}).filter(([k, v]) => SOCIAL[k] && /^https?:\/\//i.test(v));
  const hasMap = !!(latitude && longitude);
  if (!contact?.phone && !contact?.email && !contact?.address && socials.length === 0 && !hasMap) return null;

  const address = contact?.address;
  const directions = hasMap
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address ?? "")}`;
  const km = hasMap && !geo.isUsingFallback ? distanceKm(geo.lat, geo.lng, latitude!, longitude!) : null;

  return (
    <section aria-labelledby="find" className="mx-auto w-full max-w-[1440px] border-t border-ink/10 px-5 pt-10 md:px-10">
      <h2 id="find" className="relative inline-block font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">
        {title}
        <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-[var(--accent,var(--brand-chili))]" />
      </h2>
      <div className="mt-8 grid items-start gap-6 md:grid-cols-12">
        {hasMap && (
          <div className="relative h-[320px] md:order-2 md:col-span-7 md:h-[480px]">
            {style === "street" ? <DynamicRestaurantLocationMap lat={latitude!} lng={longitude!} initial={name} km={km} /> : <CartoonMap initial={name} km={km} />}
            <div role="radiogroup" aria-label={t("mapStyle")} className="shadow-soft absolute right-4 top-4 z-[600] inline-flex rounded-full bg-paper p-1">
              {(["cartoon", "street"] as const).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={style === s} onClick={() => setStyle(s)} className={`min-h-9 rounded-full px-4 font-bold transition ${style === s ? "bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]" : "text-ink/75 hover:text-ink"}`}>
                  {t(s === "cartoon" ? "mapCartoon" : "mapStreet")}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={`shadow-warm rounded-[32px] bg-paper p-4 md:p-6 ${hasMap ? "md:order-1 md:col-span-5" : "md:col-span-12"}`}>
          <div className="space-y-1">
            <ContactRow icon="phone" tint="herb" label={t("callUs")} value={contact?.phone} href={`tel:${contact?.phone?.replace(/\s/g, "")}`} />
            <ContactRow icon="pin" tint="chili" label={t("address")} value={address} href={directions} external />
            <ContactRow icon="mail" tint="saffron" label={t("emailUs")} value={contact?.email} href={`mailto:${contact?.email}`} />
          </div>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 px-3" role="group" aria-label={t("social")}>
              {socials.map(([k, href]) => (
                <a key={k} href={href} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL[k].label} title={SOCIAL[k].label} className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink transition hover:-translate-y-0.5 hover:bg-[var(--accent,var(--brand-chili))] hover:text-[var(--accent-ink,var(--brand-parchment))] active:scale-95">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>{SOCIAL[k].path}</svg>
                </a>
              ))}
            </div>
          )}
          {(address || hasMap) && (
            <div className="mt-6 flex flex-wrap gap-3 px-3">
              <a href={directions} target="_blank" rel="noreferrer" className="shadow-red inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent,var(--brand-chili))] px-6 font-bold text-[var(--accent-ink,var(--brand-parchment))] transition hover:-translate-y-0.5 active:translate-y-0">
                <Icon name="arrow" className="h-5 w-5 -rotate-45" />{t("getDirections")}
              </a>
              {address && (
                <Button variant="ghost" aria-live="polite" onClick={() => { navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  <Icon name={copied ? "check" : "ticket"} className={`h-5 w-5 ${copied ? "text-herb" : ""}`} />{copied ? t("copied") : t("copyAddress")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
