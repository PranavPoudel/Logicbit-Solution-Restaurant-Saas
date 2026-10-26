// components/home/popup-ad.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PromoCard } from "@/components/ui/promo-card";
import { getPopupAd } from "@/lib/api/discovery";
import { getFullImageUrl } from "@/lib/utils/image";
import { safeHref } from "@/lib/utils/url";

export function PopupAd() {
  const t = useTranslations("promo");
  const [visible, setVisible] = useState(false);
  const { data: ad, isFetched } = useQuery({ queryKey: ["popup-ad"], queryFn: getPopupAd });

  useEffect(() => {
    if (!isFetched || sessionStorage.getItem("logicbit-popup-shown")) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [isFetched]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("logicbit-popup-shown", "1");
  }

  if (!visible) return null;

  const href = safeHref(ad?.linkUrl);
  return (
    <PromoCard
      label={t("title")}
      sticker={t("sticker")}
      headline={ad?.title ?? t("headline")}
      body={ad ? undefined : `${t("title")}. ${t("body")}`}
      image={ad?.imageUrl ? getFullImageUrl(ad.imageUrl) : "/images/cuisine-nepali.jpg.avif"}
      cta={ad ? (href ? { text: t("cta"), href, external: /^https?:/i.test(href) } : undefined) : { text: t("cta"), href: "/restaurants" }}
      onClose={dismiss}
    />
  );
}
