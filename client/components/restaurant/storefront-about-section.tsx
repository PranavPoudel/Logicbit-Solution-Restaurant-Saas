// components/restaurant/storefront-about-section.tsx
import { Icon, Squiggle } from "@/components/ui/primitives";
import { getFullImageUrl } from "@/lib/utils/image";
import { OpeningHours } from "@/components/restaurant/opening-hours";
import type { RestaurantDetail } from "@/types/menu";

export function StorefrontAboutSection({ title, aboutText, restaurant }: { title: string; aboutText?: string | null; restaurant: RestaurantDetail }) {
  const rated = (restaurant.avgRating ?? 0) > 0;
  return (
    <section aria-labelledby="about" className="mx-auto w-full max-w-[1440px] border-t border-ink/10 px-5 py-10 md:px-10">
      <h2 id="about" className="relative inline-block font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">
        {title}
        <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-[var(--accent,var(--brand-chili))]" />
      </h2>
      <div className="shadow-warm relative mt-8 overflow-hidden rounded-[32px] bg-paper p-6 md:p-10">
        {aboutText && (
          <>
          <span aria-hidden className="pointer-events-none absolute right-6 top-2 select-none font-display text-[120px] font-extrabold leading-none text-[var(--accent,var(--brand-chili))] opacity-10 md:right-10 md:text-[140px]">”</span>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
            {restaurant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFullImageUrl(restaurant.logoUrl)} alt="" className="h-24 w-24 shrink-0 rounded-3xl border-4 border-cream object-cover shadow-soft md:h-32 md:w-32" />
            )}
            <div className="min-w-0 flex-1">
              <p className="max-w-3xl whitespace-pre-wrap font-display text-2xl font-bold leading-snug md:text-3xl">{aboutText}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4">
                <span className="font-bold">{restaurant.name}</span>
                {rated && (
                  <span className="inline-flex items-center gap-1 font-bold text-ink/75">
                    <Icon name="star" fill className="h-4 w-4 text-saffron" />{restaurant.avgRating!.toFixed(1)}
                    {restaurant.totalReviews ? <span className="font-normal">({restaurant.totalReviews})</span> : null}
                  </span>
                )}
                {restaurant.city && <span className="inline-flex items-center gap-1 text-ink/75"><Icon name="pin" className="h-4 w-4" />{restaurant.city}</span>}
              </div>
            </div>
          </div>
          </>
        )}
        <OpeningHours restaurant={restaurant} divided={!!aboutText} />
      </div>
    </section>
  );
}
