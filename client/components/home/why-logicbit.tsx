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

export function WhyLogicBit({ rating }: { rating: number }) {
  const t = useTranslations("home");
  const [first, ...rest] = theme.brand.name.split(/(?=[A-Z])/);
  const tr = useTranslations("restaurant");
  return (
    <section aria-labelledby="why" className="relative overflow-hidden bg-cream-deep">
      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-8 px-5 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:px-10 md:py-10">
        <div className="relative mx-auto w-full max-w-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.brand.whyImage} alt="" className="shadow-warm aspect-square w-full rounded-[40px] border-8 border-cream object-cover" />
          <span className="shadow-hard absolute -right-2 top-10 rotate-12 rounded-2xl border-4 border-cream bg-chili px-4 py-2 font-display text-xl font-extrabold text-parchment md:-right-8">{t("whyHot")}</span>
        </div>
        <div>
          <h2 id="why" className="font-display text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[64px]">
            {t.rich("whyTitle", { first, second: rest.join(""), b: (c) => <span className="text-chili">{c}</span>, q: (c) => <span className="text-chili">{c}</span> })}
          </h2>
          <p className="mt-4 text-xl font-medium text-ink/80">{t("whyTagline")}</p>
          <ul className="shadow-warm mt-6 divide-y-2 divide-dashed divide-ink/10 rounded-[32px] bg-paper/90 px-6 backdrop-blur-sm">
            {WHY.map((w) => (
              <li key={w.n} className="flex items-center gap-5 py-4">
                <span className="grid h-14 w-14 shrink-0 -rotate-6 place-items-center rounded-2xl bg-chili/10 text-chili"><Icon name={w.icon} className="h-7 w-7" /></span>
                <div>
                  <p className="font-display text-2xl font-extrabold leading-tight">{t(`why${w.n}`)}</p>
                  <p className="text-lg text-ink/80">{t(`whyBody${w.n}`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="shadow-soft mt-6 flex flex-wrap items-center justify-between gap-4 rounded-full bg-paper py-2 pl-6 pr-2">
            {rating > 0 ? <p className="text-lg"><b className="font-display text-2xl font-extrabold">{rating.toFixed(1)} ★</b> {t("whyRating")}</p> : <span />}
            <Link href="/restaurants"><Button size="lg" className="!bg-crimson">{tr("browseKitchens")}<Icon name="arrow" className="h-5 w-5" /></Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
