// components/home/why-logicbit.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { Button, Icon } from "@/components/ui/primitives";

const WHY = [
  { n: 1, icon: "bike" },
  { n: 2, icon: "pin" },
  { n: 3, icon: "ticket" },
  { n: 4, icon: "lock" },
];

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--color-saffron)_1.6px,transparent_1.6px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,#000_0%,transparent_55%)]" />
      <div className="blob absolute -left-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 bg-saffron md:-left-24 md:h-[680px] md:w-[680px]" />
      <div className="absolute left-[28%] top-10 hidden h-40 w-40 rounded-full bg-chili md:block" />
      <div className="absolute -bottom-16 left-[18%] h-44 w-44 rounded-full border-[14px] border-herb md:h-56 md:w-56" />
      <div className="blob absolute -right-24 -top-20 h-72 w-72 bg-chili/15 md:h-96 md:w-96" />
      <p className="absolute -bottom-6 right-0 select-none font-display text-[120px] font-extrabold leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:2px_color-mix(in_srgb,var(--color-chili)_25%,transparent)] md:text-[260px]">KHAJA</p>
      <svg viewBox="0 0 60 60" className="spin-slow absolute right-[8%] top-16 h-14 w-14 text-saffron md:h-20 md:w-20"><path d="M30 2l6 20 20 2-16 12 6 20-16-12-16 12 6-20L4 24l20-2z" fill="currentColor" /></svg>
      <svg viewBox="0 0 120 40" className="absolute bottom-24 right-[30%] hidden w-32 text-herb md:block"><path d="M4 20c14-14 24 14 38 0s24 14 38 0 24 14 36 0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /></svg>
      <span className="absolute left-[8%] top-12 h-5 w-5 rounded-full bg-herb" />
      <span className="absolute bottom-20 left-[42%] h-3 w-3 rounded-full bg-chili" />
    </div>
  );
}

export function WhyLogicBit({ rating }: { rating: number }) {
  const t = useTranslations("home");
  const tr = useTranslations("restaurant");
  return (
    <section aria-labelledby="why" className="relative overflow-hidden">
      <Backdrop />
      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-10 px-5 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:px-10 md:py-24">
        <div className="relative mx-auto w-full max-w-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.brand.whyImage} alt="" className="arch shadow-warm aspect-[3/4] w-full border-8 border-cream object-cover" />
          <span className="shadow-hard absolute -right-2 top-10 rotate-12 rounded-2xl border-4 border-cream bg-saffron px-4 py-2 font-display text-xl font-extrabold text-espresso md:-right-8">{t("whyHot")}</span>
        </div>
        <div>
          <h2 id="why" className="font-display text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[64px]">
            {t.rich("whyTitle", { b: (c) => <span className="text-chili">{c}</span>, q: (c) => <span className="text-saffron">{c}</span> })}
          </h2>
          <ul className="shadow-warm mt-8 divide-y-2 divide-dashed divide-ink/10 rounded-[32px] bg-paper/90 px-6 backdrop-blur-sm">
            {WHY.map((w) => (
              <li key={w.n} className="flex items-center gap-5 py-5">
                <span className="grid h-14 w-14 shrink-0 -rotate-6 place-items-center rounded-2xl bg-chili/10 text-chili"><Icon name={w.icon} className="h-7 w-7" /></span>
                <div>
                  <p className="font-display text-2xl font-extrabold leading-tight">{t(`why${w.n}`)}</p>
                  <p className="text-lg text-ink/80">{t(`whyBody${w.n}`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="shadow-soft mt-8 flex flex-wrap items-center justify-between gap-4 rounded-full bg-paper py-2 pl-6 pr-2">
            {rating > 0 ? <p className="text-lg"><b className="font-display text-2xl font-extrabold">{rating.toFixed(1)} ★</b> {t("whyRating")}</p> : <span />}
            <Link href="/restaurants"><Button size="lg">{tr("browseKitchens")}<Icon name="arrow" className="h-5 w-5" /></Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
