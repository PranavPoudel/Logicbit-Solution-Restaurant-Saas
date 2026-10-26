// components/home/owner-banner.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";

export function OwnerBanner() {
  const t = useTranslations("home");
  return (
    <section id="partner" className="relative mx-5 mb-16 mt-16 overflow-hidden rounded-[40px] bg-crimson px-6 py-10 text-cream md:mx-10 md:mt-24 md:min-h-[400px] md:px-14 md:py-14">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cuisine-indian.jpg.avif" alt="" className="absolute -bottom-10 right-[4%] hidden h-[400px] w-[400px] rotate-3 rounded-[32px] border-8 border-cream object-cover shadow-warm md:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cuisine-newari.jpg.avif" alt="" className="absolute -bottom-8 right-[33%] hidden h-[290px] w-[210px] -rotate-6 rounded-[28px] border-8 border-cream object-cover shadow-warm xl:block" />
      <div className="relative max-w-xl md:max-w-[46%] xl:max-w-xl">
        <p className="font-bold uppercase tracking-widest text-saffron">{t("ownerKicker")}</p>
        <h2 className="font-display mt-2 text-4xl font-extrabold leading-[0.95] tracking-tight [text-wrap:balance] md:text-6xl">{t("ownerTitle")}</h2>
        <p className="mt-4 max-w-lg text-base lg:text-lg">{t("ownerBody", { brand: theme.brand.name })}</p>
        <Link href="/for-restaurants" className="shadow-hard mt-7 inline-flex h-14 items-center rounded-full bg-saffron px-8 font-display text-lg font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream active:translate-y-0">
          {t("listMy")}{t("listKitchen")}
        </Link>
      </div>
    </section>
  );
}
