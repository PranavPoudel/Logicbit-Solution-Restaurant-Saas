// components/home/owner-banner.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";

export function OwnerBanner() {
  const t = useTranslations("home");
  return (
    <section id="partner" className="relative mx-5 mb-20 overflow-hidden rounded-[48px] bg-herb px-6 py-14 text-cream md:mx-10 md:px-16 md:py-20">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-saffron/90" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cuisine-indian.jpg.avif" alt="" className="blob absolute -bottom-24 right-[10%] hidden h-[380px] w-[380px] object-cover shadow-warm md:block" />
      <div className="relative max-w-2xl">
        <p className="font-bold uppercase tracking-widest text-saffron">{t("ownerKicker")}</p>
        <h2 className="font-display mt-3 text-5xl font-extrabold leading-[0.9] tracking-tight md:text-8xl">{t("ownerTitle")}</h2>
        <p className="mt-6 max-w-lg text-lg">{t("ownerBody", { brand: theme.brand.name })}</p>
        <Link href="/for-restaurants" className="group mt-10 inline-grid h-44 w-44 -rotate-6 place-items-center rounded-full bg-saffron text-center font-display text-2xl font-extrabold leading-tight text-ink shadow-hard transition hover:rotate-6 hover:scale-105">
          {t("listMy")}<br />{t("listKitchen")}
        </Link>
      </div>
    </section>
  );
}
