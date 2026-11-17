import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Customer pages that should stay out of search (cart, checkout, ...) are marked noindex by the middleware instead,
// because a page blocked here can never be seen to be noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/owner", "/admin", "/delivery", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
