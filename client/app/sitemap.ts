import type { MetadataRoute } from "next";
import { LOCALES, PUBLIC_PATHS, SITE_URL, fetchSitemapRestaurants, localeAlternates } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await fetchSitemapRestaurants();
  const pages = [
    ...PUBLIC_PATHS.map((path) => ({ path, lastModified: undefined as string | undefined })),
    ...restaurants.map((r) => ({ path: `/restaurants/${r.slug}`, lastModified: r.updatedAt })),
  ];
  return pages.flatMap(({ path, lastModified }) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified,
      alternates: { languages: localeAlternates(locale, path).languages },
    })),
  );
}
