// components/home/how-it-works.tsx
"use client";

import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";

const STEPS = [
  { n: 1, color: "text-chili", bg: "bg-chili", pos: "", mask: "blob" },
  { n: 2, color: "text-saffron", bg: "bg-saffron", pos: "md:mt-40", mask: "arch" },
  { n: 3, color: "text-herb", bg: "bg-herb", pos: "md:mt-12", mask: "blob" },
];

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="absolute inset-x-0 top-[38%] h-[46%] w-full">
        <path d="M0 140 C 240 40, 420 260, 720 170 S 1180 40, 1440 150 L1440 300 C 1180 200, 960 360, 720 300 S 240 200, 0 290 Z" className="fill-saffron/30" />
      </svg>
      <div className="absolute right-0 top-0 h-80 w-[45%] opacity-60 [background-image:radial-gradient(var(--color-chili)_1.5px,transparent_1.5px)] [background-size:22px_22px] [mask-image:linear-gradient(225deg,#000,transparent_70%)]" />
      <div className="blob absolute -right-28 top-24 h-72 w-72 bg-herb/15 md:h-96 md:w-96" />
      <p className="absolute right-2 top-6 hidden select-none font-display text-[200px] font-extrabold leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:2px_color-mix(in_srgb,var(--color-saffron)_55%,transparent)] md:block">1-2-3</p>
      <svg viewBox="0 0 60 60" className="spin-slow absolute left-[46%] top-20 h-12 w-12 text-chili md:h-16 md:w-16"><path d="M30 2l6 20 20 2-16 12 6 20-16-12-16 12 6-20L4 24l20-2z" fill="currentColor" /></svg>
      <svg viewBox="0 0 120 40" className="absolute bottom-16 left-[6%] w-28 text-chili"><path d="M4 20c14-14 24 14 38 0s24 14 38 0 24 14 36 0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /></svg>
      <span className="absolute bottom-[18%] right-[22%] h-16 w-16 rounded-full border-[10px] border-saffron" />
      <span className="absolute left-[32%] top-[30%] h-4 w-4 rounded-full bg-herb" />
      <span className="absolute bottom-10 right-[8%] h-3 w-3 rounded-full bg-chili" />
    </div>
  );
}

export function HowItWorks() {
  const t = useTranslations("home");
  return (
    <section aria-labelledby="hiw" className="relative overflow-hidden">
      <Backdrop />
      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
        <p className="font-bold uppercase tracking-widest text-chili">{t("howKicker")}</p>
        <h2 id="hiw" className="mt-2 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[64px]">{t("howTitle")}</h2>
        <div className="relative mt-12">
          <svg viewBox="0 0 1200 360" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-16 hidden h-[360px] w-full md:block" aria-hidden>
            <path d="M200 120 C 360 40, 380 320, 600 300 S 860 80, 1000 150" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="4" strokeDasharray="4 14" strokeLinecap="round" />
          </svg>
          <span className="absolute bottom-10 left-[27px] top-10 w-0 border-l-4 border-dashed border-ink/25 md:hidden" aria-hidden />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s) => (
              <li key={s.n} className={`${s.pos} relative flex gap-5 md:block`}>
                <span className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-paper font-display text-3xl font-extrabold shadow-soft md:hidden ${s.color}`}>{s.n}</span>
                <div className="flex-1">
                  <div className="relative">
                    <span className={`absolute -left-2 -top-16 z-10 hidden font-display text-[180px] font-extrabold leading-none md:block ${s.color}`} aria-hidden>{s.n}</span>
                    <span aria-hidden className={`${s.mask} ${s.bg} absolute left-3 top-3 hidden aspect-square w-[80%] rotate-6 md:ml-12 md:block`} />
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
