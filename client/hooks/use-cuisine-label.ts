// hooks/use-cuisine-label.ts
import { useTranslations } from "next-intl";
import { cuisineName, cuisineSlug } from "@/lib/utils/cuisine";

type CuisineInput = string | { slug?: string; name?: string };

/** Translated cuisine name; falls back to the name the backend sent. */
export function useCuisineLabel() {
  const t = useTranslations("cuisineNames");
  return (c: CuisineInput) => {
    const slug = cuisineSlug(c);
    return slug && t.has(slug) ? t(slug) : cuisineName(c);
  };
}
