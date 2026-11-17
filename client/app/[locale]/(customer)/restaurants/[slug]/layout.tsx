import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OG_LOCALE, SITE_URL, fetchRestaurantForSeo, jsonLdString, localeAlternates, restaurantJsonLd } from "@/lib/seo";

type Params = Promise<{ locale: string; slug: string }>;

// The restaurant page is a client component, so its title, description and link preview are set here, on the server.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const restaurant = await fetchRestaurantForSeo(slug);
  if (!restaurant?.name) return {};

  const t = await getTranslations({ locale, namespace: "seo" });
  const description = restaurant.city ? t("restaurantDescription", { name: restaurant.name, city: restaurant.city }) : t("restaurantDescriptionNoCity", { name: restaurant.name });
  const alternates = localeAlternates(locale, `/restaurants/${slug}`);
  const image = restaurant.coverImageUrl || restaurant.logoUrl;

  return {
    title: restaurant.name,
    description,
    alternates,
    openGraph: { type: "website", title: restaurant.name, description, url: alternates.canonical, locale: OG_LOCALE[locale], images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title: restaurant.name, description, images: image ? [image] : undefined },
  };
}

export default async function RestaurantLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { locale, slug } = await params;
  const restaurant = await fetchRestaurantForSeo(slug);
  return (
    <>
      {restaurant?.name && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(restaurantJsonLd(restaurant, `${SITE_URL}/${locale}/restaurants/${slug}`)) }} />}
      {children}
    </>
  );
}
