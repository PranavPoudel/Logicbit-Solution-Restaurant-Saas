// Shared by the sitemap, robots file, middleware and restaurant page tags. Keep it free of browser and Node-only code:
// the middleware (edge runtime) imports it too.

export const LOCALES = ["en", "ja"] as const;
export const DEFAULT_LOCALE = "en";

/** The public address of the website. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** Pages in the customer site that should be in the sitemap (the home page is ""). */
export const PUBLIC_PATHS = ["", "/restaurants", "/explore", "/for-restaurants", "/privacy", "/terms"];

export const OG_LOCALE: Record<string, string> = { en: "en_US", ja: "ja_JP" };

/** Canonical address plus the address of each language version, for the same page. */
export function localeAlternates(locale: string, path: string) {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      "x-default": `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
    },
  };
}

const APP_PREFIXES = ["/owner", "/admin", "/delivery", "/api"];
const CUSTOMER_PRIVATE = ["cart", "checkout", "orders", "account", "payment", "login", "signup", "forgot-password", "reset-password", "verify-email", "auth", "unsubscribe", "search"];

/** Pages that belong to one person or one restaurant's staff, so they must not appear in search results. */
export function isPrivatePath(pathname: string) {
  if (APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
  const [first, second] = pathname.split("/").filter(Boolean);
  const page = (LOCALES as readonly string[]).includes(first) ? second : first;
  return !!page && CUSTOMER_PRIVATE.includes(page);
}

interface RestaurantSeo {
  name?: string;
  slug?: string;
  city?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  latitude?: number;
  longitude?: number;
  avgRating?: number;
  totalReviews?: number;
  cuisines?: { name?: string }[];
}

/** schema.org Restaurant data, so search engines can show the restaurant's details. */
// shortcut: opening hours and the menu are left out, add them if rich results for them matter.
export function restaurantJsonLd(r: RestaurantSeo, url: string) {
  const cuisines = (r.cuisines ?? []).map((c) => c.name).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    url,
    image: r.coverImageUrl || r.logoUrl || undefined,
    telephone: r.phone || undefined,
    servesCuisine: cuisines.length ? cuisines : undefined,
    address: r.address || r.city ? { "@type": "PostalAddress", streetAddress: r.address || undefined, addressLocality: r.city || undefined } : undefined,
    geo: r.latitude != null && r.longitude != null ? { "@type": "GeoCoordinates", latitude: r.latitude, longitude: r.longitude } : undefined,
    aggregateRating: r.avgRating && r.totalReviews ? { "@type": "AggregateRating", ratingValue: r.avgRating, reviewCount: r.totalReviews } : undefined,
  };
}

/** JSON for a <script type="application/ld+json"> tag. A "<" is escaped so a restaurant name can never close the tag. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Reads the public restaurant straight from the API on the server (not through the browser client). */
export async function fetchRestaurantForSeo(slug: string): Promise<RestaurantSeo | null> {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return null;
  try {
    const res = await fetch(`${api}/discovery/restaurants/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? body ?? null;
  } catch {
    return null;
  }
}

/** Slugs and last change of every live restaurant, for the sitemap. An unreachable API only means a shorter sitemap. */
export async function fetchSitemapRestaurants(): Promise<{ slug: string; updatedAt?: string }[]> {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return [];
  try {
    const res = await fetch(`${api}/discovery/sitemap/restaurants`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const body = await res.json();
    return body?.data ?? [];
  } catch {
    return [];
  }
}
