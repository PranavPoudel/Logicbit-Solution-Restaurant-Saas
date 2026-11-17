// components/home/how-it-works.tsx
"use client";

import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";

const STEPS = [
  { n: 1, pos: "", mask: "blob" },
  { n: 2, pos: "md:mt-16", mask: "arch" },
  { n: 3, pos: "md:mt-6", mask: "blob" },
];

export function HowItWorks() {
  const t = useTranslations("home");
  return (
    <section aria-labelledby="hiw" className="relative overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-8 md:px-10 md:py-10">
        <p className="font-bold uppercase tracking-widest text-chili">{t("howKicker")}</p>
        <h2 id="hiw" className="mt-2 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[64px]">{t("howTitle")}</h2>
        <div className="relative mt-8 md:mt-12">
          <svg viewBox="0 0 1200 360" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-16 hidden h-[300px] w-full md:block" aria-hidden>
            <path d="M200 120 C 360 40, 380 320, 600 300 S 860 80, 1000 150" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="4" strokeDasharray="4 14" strokeLinecap="round" />
          </svg>
          <span className="absolute bottom-10 left-[27px] top-10 w-0 border-l-4 border-dashed border-ink/25 md:hidden" aria-hidden />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {STEPS.map((s) => (
              <li key={s.n} className={`${s.pos} relative flex gap-5 md:block`}>
                <span className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-paper font-display text-3xl font-extrabold shadow-soft md:hidden text-chili`}>{s.n}</span>
                <div className="flex-1">
                  <div className="relative">
                    <span className={`absolute -left-2 -top-16 z-10 hidden font-display text-[180px] font-extrabold leading-none md:block text-chili`} aria-hidden>{s.n}</span>
                    <span aria-hidden className={`${s.mask} bg-espresso absolute left-3 top-3 hidden aspect-square w-[80%] rotate-6 md:ml-12 md:block`} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={theme.brand.stepImages[s.n - 1]} alt="" className={`${s.mask} shadow-warm relative mb-4 aspect-[4/3] w-full border-[6px] border-cream object-cover md:ml-12 md:aspect-square md:w-[80%]`} />
                  </div>
                  <h3 className="font-display text-[28px] font-extrabold leading-tight">{t(`howStep${s.n}`)}</h3>
                  <p className="mt-1 text-lg text-ink/80">{t(`howBody${s.n}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
