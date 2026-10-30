// components/ui/promo-card.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { Icon, IconButton } from "@/components/ui/primitives";

interface PromoCardProps {
  label: string;
  sticker: string;
  headline: string;
  body?: string;
  image: string;
  cta?: { text: string; href: string; external?: boolean };
  onClose: () => void;
}

export function PromoCard({ label, sticker, headline, body, image, cta, onClose }: PromoCardProps) {
  const t = useTranslations("promo");
  const pathname = usePathname();
  const raised = /(?:^|\/)(restaurants\/[^/]+|cart)(\/|$)/.test(pathname);
  useEscapeKey(onClose, false);

  const big = headline.length <= 10;

  return (
    <aside
      role="dialog"
      aria-label={label}
      className={`sheet-in fixed left-4 z-40 w-[calc(100%-2rem)] max-w-[360px] ${raised ? "bottom-36 lg:bottom-4" : "bottom-4"}`}
    >
      <div className="shadow-warm relative overflow-hidden rounded-[28px] bg-chili p-5 pr-28 text-parchment">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="blob absolute -bottom-6 -right-8 h-36 w-36 object-cover" />
        <span className={`rounded-xl bg-saffron px-2 py-0.5 font-display text-base font-extrabold text-espresso shadow-hard ${big ? "absolute right-16 top-3 max-w-[110px] rotate-12 truncate" : "mb-3 inline-block -rotate-3"}`}>{sticker}</span>
        <IconButton icon="x" label={t("close")} onClick={onClose} className="absolute right-2 top-2 z-10 bg-parchment text-espresso" />
        <p className={`font-display font-extrabold leading-none ${big ? "text-[44px]" : "text-[30px] leading-[1.05]"}`}>{headline}</p>
        {body && <p className="mt-1 text-base font-medium">{body}</p>}
        {cta &&
          (cta.external ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={onClose}
              className="relative z-10 mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-parchment px-5 font-bold text-chili shadow-soft transition hover:-translate-y-0.5"
            >
              {cta.text}
              <Icon name="arrow" className="h-5 w-5" />
            </a>
          ) : (
            <Link
              href={cta.href}
              onClick={onClose}
              className="relative z-10 mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-parchment px-5 font-bold text-chili shadow-soft transition hover:-translate-y-0.5"
            >
              {cta.text}
              <Icon name="arrow" className="h-5 w-5" />
            </Link>
          ))}
      </div>
    </aside>
  );
}
