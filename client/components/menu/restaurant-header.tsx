// components/menu/restaurant-header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "@/lib/api/customers";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { useRequireLogin } from "@/hooks/use-require-login";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { cuisineList } from "@/lib/utils/cuisine";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import { getFullImageUrl } from "@/lib/utils/image";
import { restaurantImage } from "@/lib/utils/cuisine";
import type { RestaurantDetail } from "@/types/menu";
import { Button, Icon, IconButton, OpenBadge } from "@/components/ui/primitives";

function RefundDialog({ text, onClose }: { text?: string | null; onClose: () => void }) {
  const t = useTranslations();
  useEscapeKey(onClose);
  const ref = useDialogFocus<HTMLDivElement>();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-5 backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="refund-title" onClick={(e) => e.stopPropagation()} className="pop w-full max-w-lg rounded-[28px] bg-cream p-7 text-ink shadow-warm">
        <h2 id="refund-title" className="font-display text-3xl font-extrabold">{t("restaurant.refundPolicy")}</h2>
        <p className="mt-3 whitespace-pre-line text-lg leading-relaxed">{text?.trim() || t("common.refundFallback")}</p>
        <Button className="mt-6" onClick={onClose}>{t("restaurant.gotIt")}</Button>
      </div>
    </div>
  );
}

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantDetail }) {
  const t = useTranslations("restaurant");
  const cuisineLabel = useCuisineLabel();
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const [shared, setShared] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const name = restaurant.name ?? t("fallbackName");
  const cuisines = cuisineList(restaurant.cuisines);
  const open = restaurant.isOpen !== false;
  const rating = restaurant.avgRating ?? 0;
  const initials = name.split(/\s+/).map((w) => w[0]).filter((c) => /[A-Za-z0-9&]/.test(c)).slice(0, 2).join("").toUpperCase();

  const { data: favorites } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesApi.list() as Promise<{ restaurantId: string }[]>,
    enabled: isAuthenticated,
  });
  const fav = !!favorites?.some((f) => f.restaurantId === restaurant.id);
  const toggleFav = useMutation({
    mutationFn: () => (fav ? favoritesApi.remove(restaurant.id) : favoritesApi.add(restaurant.id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["my-favorites"] }),
  });

  const info = [
    restaurant.address && { icon: "pin", label: t("address"), value: restaurant.address },
    restaurant.phone && { icon: "phone", label: t("phone"), value: restaurant.phone, href: `tel:${restaurant.phone}` },
    restaurant.estimatedDeliveryMinutes != null && { icon: "clock", label: t("deliveryTime"), value: t("minutes", { count: restaurant.estimatedDeliveryMinutes }) },
    { icon: "info", label: t("refundPolicy"), value: t("readPolicy"), link: true },
  ].filter(Boolean) as { icon: string; label: string; value: string; href?: string; link?: boolean }[];

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
      <div className="relative h-[200px] rounded-[32px] md:h-[280px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={restaurant.coverImageUrl ? getFullImageUrl(restaurant.coverImageUrl) : restaurantImage(restaurant)} alt={t("foodAt", { name })} className="h-full w-full rounded-[32px] object-cover" />
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-espresso/45 to-transparent to-50%" />
        <Link href="/restaurants" className="shadow-soft absolute left-4 top-4 flex min-h-11 items-center gap-1 rounded-full bg-parchment px-4 font-bold text-espresso">
          <Icon name="back" />{t("allKitchens")}
        </Link>
        <div className="absolute right-4 top-4 flex gap-2">
          <IconButton
            icon="heart"
            label={fav ? t("removeFavourite") : t("addFavourite")}
            aria-pressed={fav}
            onClick={() => requireLogin() && toggleFav.mutate()}
            className={`shadow-soft ${fav ? "bg-chili text-parchment" : "bg-parchment text-espresso"}`}
          />
          <IconButton
            icon={shared ? "check" : "share"}
            label={t("share")}
            onClick={() => {
              navigator.clipboard?.writeText(location.href);
              setShared(true);
              setTimeout(() => setShared(false), 1500);
            }}
            className="shadow-soft bg-parchment text-espresso"
          />
        </div>
        <div className="shadow-soft absolute -bottom-12 left-6 grid h-24 w-24 place-items-center overflow-hidden rounded-full border-[6px] border-cream bg-[var(--accent,var(--brand-chili))] font-display text-3xl font-extrabold text-[var(--accent-ink,var(--brand-parchment))] md:left-10 md:h-28 md:w-28 md:text-4xl">
          {restaurant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getFullImageUrl(restaurant.logoUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[56px]">{name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <OpenBadge open={open} />
            {cuisines.map((c) => (
              <span key={c.key} className="rounded-full bg-paper px-3 py-1 font-bold text-ink shadow-soft">{cuisineLabel(c.name)}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex min-h-11 items-center gap-2 rounded-full bg-saffron px-4 font-bold text-espresso">
            <Icon name="star" fill className="h-5 w-5" />
            {rating > 0 ? rating.toFixed(1) : t("new")}
          </span>
          {restaurant.estimatedDeliveryMinutes != null && (
            <span className="flex min-h-11 items-center gap-2 rounded-full bg-paper px-4 font-bold shadow-soft"><Icon name="clock" className="h-5 w-5" />{t("minutes", { count: restaurant.estimatedDeliveryMinutes })}</span>
          )}
          {restaurant.distanceKm != null && (
            <span className="flex min-h-11 items-center gap-2 rounded-full bg-paper px-4 font-bold shadow-soft"><Icon name="pin" className="h-5 w-5" />{t("km", { value: restaurant.distanceKm.toFixed(1) })}</span>
          )}
        </div>
      </div>
      {!open && <p className="mt-4 rounded-2xl bg-ink/5 p-4 font-medium">{t("closedNote")}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-[28px] bg-paper p-5 shadow-soft md:p-6 lg:grid-cols-4">
        {info.map((i) => {
          const body = (
            <>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))]/10 text-[var(--accent,var(--brand-chili))]"><Icon name={i.icon} /></span>
              <span className="min-w-0">
                <span className="block text-ink/65">{i.label}</span>
                <span className={`block font-bold ${i.link ? "underline underline-offset-4" : ""}`}>{i.value}</span>
              </span>
            </>
          );
          const cls = "flex flex-col gap-2 text-left sm:flex-row sm:items-center sm:gap-3";
          return i.href ? (
            <a key={i.label} href={i.href} className={cls}>{body}</a>
          ) : i.link ? (
            <button key={i.label} type="button" onClick={() => setRefundOpen(true)} className={cls}>{body}</button>
          ) : (
            <div key={i.label} className={cls}>{body}</div>
          );
        })}
      </div>

      {refundOpen && <RefundDialog text={restaurant.refundPolicy} onClose={() => setRefundOpen(false)} />}
    </section>
  );
}
