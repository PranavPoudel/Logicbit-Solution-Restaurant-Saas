// components/home/banner-carousel.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getHomepageBanners } from "@/lib/api/discovery";
import { getFullImageUrl } from "@/lib/utils/image";
import { safeHref } from "@/lib/utils/url";
import { Icon } from "@/components/ui/primitives";

export function BannerCarousel() {
  const t = useTranslations("home");
  const { data: banners = [] } = useQuery({ queryKey: ["homepage-banners"], queryFn: getHomepageBanners });
  const items = banners.filter((b) => b.imageUrl);
  if (items.length === 0) return null;

  return (
    <section aria-label={t("bannersLabel")} className="mx-auto w-full max-w-[1440px] px-5 pt-6 md:px-10">
      <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0">
        {items.map((b) => {
          const href = safeHref(b.linkUrl) ?? (b.restaurant?.slug ? `/restaurants/${b.restaurant.slug}` : "/restaurants");
          return (
            <li key={b.id} className="w-[88%] shrink-0 snap-start md:w-[48.5%]">
              <Link href={href} className="group shadow-warm relative flex min-h-48 items-center gap-4 overflow-hidden rounded-[32px] bg-paper p-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-saffron md:p-6">
                <span className="flex min-w-0 flex-1 flex-col items-start gap-3">
                  <span className="min-w-0">
                    <span className="block font-display text-2xl font-extrabold leading-tight text-ink md:text-3xl">{b.title}</span>
                    {b.restaurant?.name && <span className="mt-1 block truncate text-lg text-ink/70">{b.restaurant.name}</span>}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-saffron text-espresso transition group-hover:translate-x-1"><Icon name="arrow" className="h-6 w-6" /></span>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFullImageUrl(b.imageUrl)} alt="" className="blob aspect-square w-2/5 shrink-0 object-cover transition duration-500 group-hover:scale-105" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
